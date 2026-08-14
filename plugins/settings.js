export const getSettingsSchema = () => ({
  schema: {
    id: 'flotiq.ai-example-content-settings',
    schemaDefinition: {
      type: 'object',
      allOf: [
        {
          $ref: '#/components/schemas/AbstractContentTypeSchemaDefinition',
        },
        {
          type: 'object',
          properties: {
            openAiApiKey: {
              type: 'string',
            },
            projectDescription: {
              type: 'string',
            },
          },
        },
      ],
      required: ['openAiApiKey'],
      additionalProperties: false,
    },
    metaDefinition: {
      order: ['openAiApiKey', 'projectDescription'],
      propertiesConfig: {
        openAiApiKey: {
          label: 'OpenAI API key',
          unique: false,
          helpText: '',
          inputType: 'text',
          isPassword: true,
        },
        projectDescription: {
          label: 'Project description',
          inputType: 'textarea',
          unique: false,
          helpText:
            'Optional context used to tailor the generated example content.',
        },
      },
    },
  },
});

export const parseSettings = (settings) => {
  if (!settings) return {};

  try {
    const parsedSettings =
      typeof settings === 'string' ? JSON.parse(settings) : settings;

    if (!parsedSettings || typeof parsedSettings !== 'object') return {};

    return {
      openAiApiKey:
        typeof parsedSettings.openAiApiKey === 'string'
          ? parsedSettings.openAiApiKey.trim()
          : '',
      projectDescription:
        typeof parsedSettings.projectDescription === 'string'
          ? parsedSettings.projectDescription.trim()
          : '',
    };
  } catch {
    return {};
  }
};

export const getPluginSettings = (globals) =>
  parseSettings(globals?.getPluginSettings?.());
