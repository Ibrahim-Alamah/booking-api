import { Controller, Post, Body, Delete, Param, ParseUUIDPipe, HttpException, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking successfully created.' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 404, description: 'SLOT_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'SLOT_UNAVAILABLE' })
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Booking successfully cancelled.' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 404, description: 'BOOKING_NOT_FOUND' })
  async remove(
    @Param('id', new ParseUUIDPipe({ 
      exceptionFactory: () => new HttpException(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid UUID format.' } }, 
        HttpStatus.BAD_REQUEST
      )
    })) id: string
  ) {
    return this.bookingsService.remove(id);
  }
}
