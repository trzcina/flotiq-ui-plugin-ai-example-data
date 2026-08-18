const INTERNAL_FIELDS = new Set(['id', 'internal']);

const getInputType = (name, metadata) =>
  metadata?.propertiesConfig?.[name]?.inputType;

const getContentTypeProperties = (contentType) =>
  contentType?.schemaDefinition?.allOf?.[1]?.properties ||
  contentType?.schemaDefinition?.properties ||
  {};

const getFieldSchema = (name, property, metadata) => {
  if (INTERNAL_FIELDS.has(name) || !property || typeof property !== 'object') {
    return null;
  }

  const inputType = getInputType(name, metadata);

  if (property.type === 'number' || property.type === 'integer') {
    return { type: property.type };
  }

  if (property.type === 'boolean') {
    return { type: 'boolean' };
  }

  if (property.type !== 'string') return null;

  if (inputType === 'dateTime') {
    return {
      type: 'string',
      format: metadata?.propertiesConfig?.[name]?.showTime
        ? 'date-time'
        : 'date',
    };
  }

  if (inputType === 'richtext') {
    return {
      type: 'string',
      description: [
        'Valid semantic HTML only. Use paragraphs, headings, lists, links, and emphasis when appropriate.',
        'Do not include markdown, scripts, styles, or embedded media.',
      ].join(' '),
    };
  }

  if (!inputType || ['text', 'textarea'].includes(inputType)) {
    return { type: 'string' };
  }

  return null;
};

export const getSupportedFields = (contentType) => {
  const properties = getContentTypeProperties(contentType);
  const metadata = contentType?.metaDefinition || {};

  return Object.entries(properties).reduce((fields, [name, property]) => {
    const fieldSchema = getFieldSchema(name, property, metadata);
    if (fieldSchema) fields[name] = fieldSchema;
    return fields;
  }, {});
};

const getRichTextFieldNames = (contentType) => {
  const properties = getContentTypeProperties(contentType);
  const metadata = contentType?.metaDefinition || {};

  return Object.entries(properties)
    .filter(
      ([name, property]) =>
        property?.type === 'string' &&
        getInputType(name, metadata) === 'richtext',
    )
    .map(([name]) => name);
};

const getContentTypeName = (contentType) =>
  contentType?.name || contentType?.label || 'content object';

const getOutputText = (response) => {
  if (typeof response.output_text === 'string') return response.output_text;

  return response.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === 'output_text')?.text;
};

const getPrompt = (
  contentType,
  projectDescription,
  fieldNames,
  richTextFieldNames,
) => {
  const context = projectDescription
    ? `Project description:\n${projectDescription}\n\n`
    : '';
  const richTextInstructions = richTextFieldNames.length
    ? ` For rich-text fields (${richTextFieldNames.join(
        ', ',
      )}), return valid semantic HTML only. For every other field, return plain values without HTML.`
    : '';

  return `${context}Create realistic, internally consistent example content for a new ${getContentTypeName(
    contentType,
  )}. Generate fresh details that differ from common defaults. Return values only for these fields: ${fieldNames.join(
    ', ',
  )}.${richTextInstructions}`;
};

const validateGeneratedValues = (values, supportedFields) => {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new Error('invalid-response');
  }

  return Object.entries(supportedFields).reduce(
    (generatedValues, [name, schema]) => {
      const value = values[name];
      const hasExpectedType =
        (schema.type === 'string' && typeof value === 'string') ||
        (schema.type === 'number' && typeof value === 'number') ||
        (schema.type === 'integer' && Number.isInteger(value)) ||
        (schema.type === 'boolean' && typeof value === 'boolean');

      if (hasExpectedType) generatedValues[name] = value;
      return generatedValues;
    },
    {},
  );
};

export const generateExampleContent = async ({
  apiKey,
  projectDescription,
  contentType,
}) => {
  const supportedFields = getSupportedFields(contentType);
  const fieldNames = Object.keys(supportedFields);
  const richTextFieldNames = getRichTextFieldNames(contentType);

  if (!fieldNames.length) throw new Error('unsupported-fields');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 1.2,
      input: getPrompt(
        contentType,
        projectDescription,
        fieldNames,
        richTextFieldNames,
      ),
      text: {
        format: {
          type: 'json_schema',
          name: 'example_content',
          strict: true,
          schema: {
            type: 'object',
            properties: supportedFields,
            required: fieldNames,
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!response.ok) throw new Error('request-failed');

  const responseBody = await response.json();
  const outputText = getOutputText(responseBody);

  try {
    return validateGeneratedValues(JSON.parse(outputText), supportedFields);
  } catch {
    throw new Error('invalid-response');
  }
};
