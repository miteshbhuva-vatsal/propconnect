import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

type Params = { params: { id: string } }

const updateSchema = z.object({
  status: z.enum(['NEW','CONTACTED','QUALIFIED','SITE_VISIT','NEGOTIATION','LOI_SIGNED','CLOSED','LOST']).optional(),
  notes: z.string().optional(),
  nextFollowUp: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  budget: z.number().optional(),
  dealValue: z.number().optional(),
  requirements: z.string().optional(),
})

// PATCH /api/crm/:id — update lead (status, notes, assignee)
export async function PATCH(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const lead = await db.crmLead.findUnique({ where: { id: params.id } })
  if (!lead || lead.ownerId !== userId) {
    return NextResponse.json(apiError('Not found'), { status: 404 })
  }

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(apiError('Invalid data'), { status: 400 })

  const { budget, dealValue, nextFollowUp, ...rest } = parsed.data
  const previousStatus = lead.status

  const updated = await db.crmLead.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(budget !== undefined ? { budget: BigInt(budget) } : {}),
      ...(dealValue !== undefined ? { dealValue: BigInt(dealValue) } : {}),
      ...(nextFollowUp ? { nextFollowUp: new Date(nextFollowUp) } : {}),
      ...(rest.status === 'CLOSED' ? { closedAt: new Date() } : {}),
    },
  })

  // Log status change activity
  if (rest.status && rest.status !== previousStatus) {
    await db.activity.create({
      data: {
        userId,
        leadId: params.id,
        action: 'status_changed',
        metadata: { from: previousStatus, to: rest.status },
      },
    })
  }

  return NextResponse.json(
    apiSuccess({
      ...updated,
      budget: updated.budget?.toString() ?? null,
      dealValue: updated.dealValue?.toString() ?? null,
    })
  )
}

// DELETE /api/crm/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const lead = await db.crmLead.findUnique({ where: { id: params.id } })
  if (!lead || lead.ownerId !== userId) {
    return NextResponse.json(apiError('Not found'), { status: 404 })
  }

  await db.crmLead.delete({ where: { id: params.id } })
  return NextResponse.json(apiSuccess(null, 'Lead deleted'))
}
