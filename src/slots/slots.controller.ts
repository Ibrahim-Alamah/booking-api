import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SlotsService } from './slots.service.js';

@ApiTags('slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiOperation({ summary: 'Get available slots' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of available slots.',
    schema: {
      example: {
        slots: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            startsAt: '2030-01-15T09:00:00.000Z',
            endsAt: '2030-01-15T09:30:00.000Z',
          },
        ],
      },
    },
  })
  async getAvailableSlots() {
    return this.slotsService.getAvailableSlots();
  }
}
