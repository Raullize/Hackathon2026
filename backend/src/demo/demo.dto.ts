import { demoAdvanceSchema } from '@careflow/contracts';
import { createZodDto } from 'nestjs-zod';

export class DemoAdvanceDto extends createZodDto(demoAdvanceSchema) {}
