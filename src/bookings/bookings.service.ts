import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { EventsGateway } from '../events/events.gateway.js';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createBookingDto: CreateBookingDto) {
    const { slotId, customerName, customerEmail } = createBookingDto;

    // Check if slot exists
    const slot = await this.prisma.slot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new HttpException(
        { error: { code: 'SLOT_NOT_FOUND', message: 'The requested slot does not exist.' } },
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      // Create active booking
      // With our Partial Unique Index, if an active booking already exists, this will throw P2002
      const booking = await this.prisma.booking.create({
        data: {
          slotId,
          customerName,
          customerEmail,
          status: 'active',
        },
        select: {
          id: true,
          slotId: true,
          customerName: true,
          customerEmail: true,
          status: true,
        },
      });

      // Emit event
      this.eventsGateway.notifySlotBooked(slotId, booking.id);

      return { booking };
    } catch (error) {
      // Prisma unique constraint violation
      if ((error as any).code === 'P2002') {
        throw new HttpException(
          { error: { code: 'SLOT_UNAVAILABLE', message: 'This slot already has an active booking.' } },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    // Validate UUID format manually or assume it's handled by ParseUUIDPipe in controller
    
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new HttpException(
        { error: { code: 'BOOKING_NOT_FOUND', message: 'The requested booking does not exist.' } },
        HttpStatus.NOT_FOUND,
      );
    }

    if (booking.status === 'cancelled') {
      // Already cancelled, return 200 with no change or event
      return {
        booking: {
          id: booking.id,
          slotId: booking.slotId,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          status: booking.status,
        },
      };
    }

    try {
      const updatedBooking = await this.prisma.booking.update({
        where: { id },
        data: { status: 'cancelled' },
        select: {
          id: true,
          slotId: true,
          customerName: true,
          customerEmail: true,
          status: true,
        },
      });

      // Emit event
      this.eventsGateway.notifySlotReleased(updatedBooking.slotId, updatedBooking.id);

      return { booking: updatedBooking };
    } catch (error) {
      throw new HttpException(
        { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
