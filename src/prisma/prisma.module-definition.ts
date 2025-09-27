import { ConfigurableModuleBuilder } from '@nestjs/common';

export const {
  ConfigurableModuleClass: PrismaModuleClass,
  MODULE_OPTIONS_TOKEN: PRISMA_MODULE_CONFIG,
} = new ConfigurableModuleBuilder<string>()
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .build();
