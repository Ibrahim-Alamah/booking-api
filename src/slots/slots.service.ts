import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots() {
    // Find slots that DO NOT have an active booking
    const availableSlots = await this.prisma.slot.findMany({
      where: {
        bookings: {
          none: {
            status: 'active',
          },
        },
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
      },
      orderBy: [
        { startsAt: 'asc' },
        { id: 'asc' },
      ],
    });

    return { slots: availableSlots };
  }
}
