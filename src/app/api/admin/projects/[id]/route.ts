import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const role = request.headers.get('x-user-role')
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json(apiError('Only super admin can edit projects'), { status: 403 })
  }

  const body = await request.json()

  const project = await db.project.update({
    where: { id: params.id },
    data: {
      ...body,
      priceFrom: body.priceFrom != null ? BigInt(body.priceFrom) : undefined,
      priceTo: body.priceTo != null ? BigInt(body.priceTo) : undefined,
      sponsoredUntil: body.sponsoredUntil ? new Date(body.sponsoredUntil) : undefined,
    },
  })

  return NextResponse.json(apiSuccess({ id: project.id }))
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const role = request.headers.get('x-user-role')
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json(apiError('Only super admin can delete projects'), { status: 403 })
  }

  await db.project.delete({ where: { id: params.id } })
  return NextResponse.json(apiSuccess(null, 'Project deleted'))
}
