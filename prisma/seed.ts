import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const db = new PrismaClient()

// Must match the secret used in src/lib/auth.ts hashPhone()
const JWT_SECRET = process.env.JWT_SECRET || 'propconnect-jwt-secret-key-super-secure-minimum-32-chars-2026'

function hashPhone(phone: string): string {
  return createHash('sha256').update(phone + JWT_SECRET).digest('hex')
}

const LISTING_EXPIRY = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

async function main() {
  console.log('🌱 Seeding PropConnect database...')

  // Create subscription plans
  const freePlan = await db.subscriptionPlanConfig.upsert({
    where: { name: 'Free Plan' },
    update: {},
    create: {
      name: 'Free Plan', plan: 'FREE', price: 0,
      billingCycle: 'monthly', dealCredits: 5,
      features: ['Browse listings', '5 deal interactions', 'Basic profile', 'WhatsApp share'],
      isActive: true, sortOrder: 0,
    },
  })

  const proPlan = await db.subscriptionPlanConfig.upsert({
    where: { name: 'Pro Broker Monthly' },
    update: {},
    create: {
      name: 'Pro Broker Monthly', plan: 'PRO', price: 199900,
      billingCycle: 'monthly', dealCredits: 999999,
      features: ['Unlimited deals', 'CRM pipeline', 'AI poster generation', 'Priority placement', 'Analytics'],
      isActive: true, isFeatured: true, sortOrder: 1,
    },
  })

  await db.subscriptionPlanConfig.upsert({
    where: { name: 'Pro Broker Yearly' },
    update: {},
    create: {
      name: 'Pro Broker Yearly', plan: 'PRO', price: 1799900,
      billingCycle: 'yearly', dealCredits: 999999,
      features: ['Everything in Pro Monthly', '25% savings', 'Priority support'],
      isActive: true, sortOrder: 2,
    },
  })

  // Create super admin
  await db.user.upsert({
    where: { phone: '+919999999999' },
    update: {
      name: 'Super Admin',
      companyName: 'PropConnect HQ',
      city: 'Mumbai', state: 'Maharashtra',
    },
    create: {
      phone: '+919999999999',
      phoneHash: hashPhone('+919999999999'),
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      verificationStatus: 'VERIFIED',
      companyName: 'PropConnect HQ',
      city: 'Mumbai', state: 'Maharashtra',
      dealCreditsLimit: 999999,
      subscription: {
        create: {
          plan: 'ENTERPRISE', dealCreditsTotal: 999999,
          planConfigId: freePlan.id,
        },
      },
    },
  })

  // Sample broker — Rajesh Mehta
  const broker1 = await db.user.upsert({
    where: { phone: '+919876543210' },
    update: {
      name: 'Rajesh Mehta',
      companyName: 'Mehta Realtors',
      designation: 'Senior Broker',
      email: 'rajesh.mehta@mehtarealtors.com',
      bio: '15+ years of experience in Mumbai real estate. Specialising in luxury residential, commercial office spaces, and JV land deals across MMR. RERA certified broker with 200+ successful transactions. Trusted by HNI clients, developers, and institutional investors.',
      city: 'Mumbai', state: 'Maharashtra',
      website: 'https://mehtarealtors.com',
      reraNumber: 'MH/12345/2024',
      gstNumber: '27AABCM1234D1Z5',
      brokerScore: 450, brokerRank: 3, totalDealsClosed: 23, totalDealsPosted: 47,
      preferredPropertyTypes: { set: ['APARTMENT', 'VILLA', 'OFFICE_SPACE', 'JV_LAND'] as any[] },
      preferredDealTypes: { set: ['SALE', 'JOINT_VENTURE', 'LEASE'] as any[] },
      preferredLocations: { set: ['Mumbai', 'Pune', 'Bengaluru'] },
      preferredPriceMin: BigInt(10000000),
      preferredPriceMax: BigInt(500000000),
    },
    create: {
      phone: '+919876543210',
      phoneHash: hashPhone('+919876543210'),
      name: 'Rajesh Mehta',
      role: 'BROKER',
      verificationStatus: 'VERIFIED',
      companyName: 'Mehta Realtors',
      designation: 'Senior Broker',
      email: 'rajesh.mehta@mehtarealtors.com',
      bio: '15+ years of experience in Mumbai real estate. Specialising in luxury residential, commercial office spaces, and JV land deals across MMR. RERA certified broker with 200+ successful transactions. Trusted by HNI clients, developers, and institutional investors.',
      city: 'Mumbai', state: 'Maharashtra',
      website: 'https://mehtarealtors.com',
      reraNumber: 'MH/12345/2024',
      gstNumber: '27AABCM1234D1Z5',
      brokerScore: 450, brokerRank: 3, totalDealsClosed: 23, totalDealsPosted: 47,
      dealCreditsLimit: 999999,
      preferredPropertyTypes: { set: ['APARTMENT', 'VILLA', 'OFFICE_SPACE', 'JV_LAND'] as any[] },
      preferredDealTypes: { set: ['SALE', 'JOINT_VENTURE', 'LEASE'] as any[] },
      preferredLocations: { set: ['Mumbai', 'Pune', 'Bengaluru'] },
      preferredPriceMin: BigInt(10000000),
      preferredPriceMax: BigInt(500000000),
      subscription: {
        create: {
          plan: 'PRO', dealCreditsTotal: 999999,
          planConfigId: proPlan.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  // Sample developer — Priya Sharma
  const developer = await db.user.upsert({
    where: { phone: '+919876543211' },
    update: {
      name: 'Priya Sharma',
      companyName: 'Sharma Developers',
      designation: 'Managing Director',
      email: 'priya@sharmadevelopers.in',
      bio: 'Real estate developer with 12 years of delivering landmark residential & commercial projects across Pune and Mumbai. Founded Sharma Developers in 2012 with a focus on affordable premium housing. Portfolio includes 3,500+ delivered units and ₹800 Cr in JV projects.',
      city: 'Pune', state: 'Maharashtra',
      website: 'https://sharmadevelopers.in',
      reraNumber: 'MH/1234/2024',
      gstNumber: '27AABCS9876E1Z2',
      brokerScore: 320, brokerRank: 8, totalDealsClosed: 15, totalDealsPosted: 28,
      preferredPropertyTypes: { set: ['JV_LAND', 'LAND', 'FARMLAND', 'APARTMENT'] as any[] },
      preferredDealTypes: { set: ['JOINT_VENTURE', 'SALE', 'BARTER'] as any[] },
      preferredLocations: { set: ['Pune', 'Mumbai', 'Nashik'] },
      preferredPriceMin: BigInt(20000000),
      preferredPriceMax: BigInt(2000000000),
    },
    create: {
      phone: '+919876543211',
      phoneHash: hashPhone('+919876543211'),
      name: 'Priya Sharma',
      role: 'DEVELOPER',
      verificationStatus: 'VERIFIED',
      companyName: 'Sharma Developers',
      designation: 'Managing Director',
      email: 'priya@sharmadevelopers.in',
      bio: 'Real estate developer with 12 years of delivering landmark residential & commercial projects across Pune and Mumbai. Founded Sharma Developers in 2012 with a focus on affordable premium housing. Portfolio includes 3,500+ delivered units and ₹800 Cr in JV projects.',
      city: 'Pune', state: 'Maharashtra',
      website: 'https://sharmadevelopers.in',
      reraNumber: 'MH/1234/2024',
      gstNumber: '27AABCS9876E1Z2',
      brokerScore: 320, brokerRank: 8, totalDealsClosed: 15, totalDealsPosted: 28,
      dealCreditsLimit: 999999,
      preferredPropertyTypes: { set: ['JV_LAND', 'LAND', 'FARMLAND', 'APARTMENT'] as any[] },
      preferredDealTypes: { set: ['JOINT_VENTURE', 'SALE', 'BARTER'] as any[] },
      preferredLocations: { set: ['Pune', 'Mumbai', 'Nashik'] },
      preferredPriceMin: BigInt(20000000),
      preferredPriceMax: BigInt(2000000000),
      subscription: {
        create: {
          plan: 'PRO', dealCreditsTotal: 999999,
          planConfigId: proPlan.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  // Sample investor — Amit Kapoor
  const investor = await db.user.upsert({
    where: { phone: '+919876543212' },
    update: {
      name: 'Amit Kapoor',
      companyName: 'Kapoor Capital',
      designation: 'HNI Investor',
      email: 'amit@kapoorcapital.in',
      bio: 'High net-worth investor with a ₹200 Cr+ real estate portfolio spanning Mumbai, Goa, and Hyderabad. Active in distressed asset acquisitions, farmland banking, and fractional commercial investments. Looking for off-market JV & barter opportunities.',
      city: 'Mumbai', state: 'Maharashtra',
      website: 'https://kapoorcapital.in',
      brokerScore: 210, totalDealsClosed: 8, totalDealsPosted: 12,
      preferredPropertyTypes: { set: ['FARMLAND', 'VILLA', 'APARTMENT', 'INDUSTRIAL_LAND'] as any[] },
      preferredDealTypes: { set: ['DISTRESSED', 'BARTER', 'JOINT_VENTURE'] as any[] },
      preferredLocations: { set: ['Mumbai', 'Goa', 'Hyderabad'] },
      preferredPriceMin: BigInt(50000000),
      preferredPriceMax: BigInt(5000000000),
    },
    create: {
      phone: '+919876543212',
      phoneHash: hashPhone('+919876543212'),
      name: 'Amit Kapoor',
      role: 'INVESTOR',
      verificationStatus: 'VERIFIED',
      companyName: 'Kapoor Capital',
      designation: 'HNI Investor',
      email: 'amit@kapoorcapital.in',
      bio: 'High net-worth investor with a ₹200 Cr+ real estate portfolio spanning Mumbai, Goa, and Hyderabad. Active in distressed asset acquisitions, farmland banking, and fractional commercial investments. Looking for off-market JV & barter opportunities.',
      city: 'Mumbai', state: 'Maharashtra',
      website: 'https://kapoorcapital.in',
      brokerScore: 210, totalDealsClosed: 8, totalDealsPosted: 12,
      dealCreditsLimit: 999999,
      preferredPropertyTypes: { set: ['FARMLAND', 'VILLA', 'APARTMENT', 'INDUSTRIAL_LAND'] as any[] },
      preferredDealTypes: { set: ['DISTRESSED', 'BARTER', 'JOINT_VENTURE'] as any[] },
      preferredLocations: { set: ['Mumbai', 'Goa', 'Hyderabad'] },
      preferredPriceMin: BigInt(50000000),
      preferredPriceMax: BigInt(5000000000),
      subscription: {
        create: {
          plan: 'PRO', dealCreditsTotal: 999999,
          planConfigId: proPlan.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  // Dummy PDF brochure (publicly accessible sample PDF)
  const SAMPLE_PDF = 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2/table-word.pdf'

  // Sample listings
  const listings = [
    {
      title: '3BHK Sea-facing Apartment in Bandra West',
      description: 'A stunning 3BHK apartment with panoramic sea views in the heart of Bandra West. Premium finishes, modular kitchen, and spacious balcony.',
      propertyType: 'APARTMENT' as const, dealType: 'SALE' as const,
      area: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050',
      price: BigInt(28000000), sizeSqft: 1250, bedrooms: 3, bathrooms: 2,
      amenities: ['Parking', 'Lift', 'Security', 'Power Backup', 'CCTV'],
      userId: broker1.id, status: 'APPROVED' as const,
      slug: 'bhk-sea-facing-bandra-west-001',
      viewCount: 142, inquiryCount: 8, isBoosted: true,
      mapUrl: 'https://www.google.com/maps/@19.0596,72.8295,15z',
      brochureUrl: SAMPLE_PDF,
      coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
      ],
    },
    {
      title: 'Premium Villa with Private Garden — Lonavala',
      description: 'Exquisite 4BHK villa with private garden, infinity pool, and breathtaking valley views. Perfect weekend home or Airbnb investment.',
      propertyType: 'VILLA' as const, dealType: 'SALE' as const,
      area: 'Lonavala', city: 'Lonavala', state: 'Maharashtra', pincode: '410401',
      price: BigInt(65000000), sizeSqft: 3200, bedrooms: 4, bathrooms: 4,
      amenities: ['Parking', 'Swimming Pool', 'Garden', 'Security', 'Power Backup'],
      userId: broker1.id, status: 'APPROVED' as const,
      slug: 'premium-villa-lonavala-002',
      viewCount: 89, inquiryCount: 5,
      mapUrl: 'https://www.google.com/maps/@18.7537,73.4058,14z',
      brochureUrl: SAMPLE_PDF,
      coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      ],
    },
    {
      title: '5 Acre Farmland with Water Source — Nashik',
      description: 'Fertile 5-acre farmland near Nashik with year-round water source, road access, and electricity. Ideal for agriculture or resort development.',
      propertyType: 'FARMLAND' as const, dealType: 'SALE' as const,
      area: 'Gangapur', city: 'Nashik', state: 'Maharashtra',
      price: BigInt(12000000), sizeAcres: 5,
      amenities: ['Power Backup'],
      userId: developer.id, status: 'APPROVED' as const,
      slug: 'farmland-nashik-003',
      viewCount: 67, inquiryCount: 12,
      mapUrl: 'https://www.google.com/maps/@19.9975,73.7898,14z',
      coverImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80',
        'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&q=80',
      ],
    },
    {
      title: 'JV Opportunity — 2 Acre Residential Plot, Pune Hinjewadi',
      description: 'Exceptional JV opportunity on 2-acre prime land in Hinjewadi IT corridor. Approved layout, DP road access, 1.5 FSI. Suitable for 200+ unit residential complex.',
      propertyType: 'JV_LAND' as const, dealType: 'JOINT_VENTURE' as const,
      area: 'Hinjewadi', city: 'Pune', state: 'Maharashtra',
      price: BigInt(80000000), sizeAcres: 2,
      amenities: [],
      userId: developer.id, status: 'APPROVED' as const,
      slug: 'jv-land-pune-hinjewadi-004',
      viewCount: 201, inquiryCount: 18, isBoosted: true,
      mapUrl: 'https://www.google.com/maps/@18.5912,73.7388,14z',
      brochureUrl: SAMPLE_PDF,
      coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80',
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
      ],
    },
    {
      title: 'Industrial Warehouse with Loading Dock — Bhiwandi',
      description: 'Large 50,000 sq ft warehouse in Bhiwandi logistics hub. Dedicated loading bays, 3-phase power, 24/7 security. Ideal for e-commerce, FMCG, or manufacturing.',
      propertyType: 'WAREHOUSE' as const, dealType: 'LEASE' as const,
      area: 'Bhiwandi', city: 'Bhiwandi', state: 'Maharashtra',
      price: BigInt(5000000), sizeSqft: 50000,
      amenities: ['Parking', 'Security', 'Power Backup', 'CCTV'],
      userId: broker1.id, status: 'APPROVED' as const,
      slug: 'warehouse-bhiwandi-005',
      viewCount: 334, inquiryCount: 22,
      mapUrl: 'https://www.google.com/maps/@19.2969,73.0575,14z',
      brochureUrl: SAMPLE_PDF,
      coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
        'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
      ],
    },
    {
      title: 'Barter Deal — Bungalow vs Commercial Property, Andheri',
      description: 'Offering 4BHK bungalow in Andheri East (value ₹4.5 Cr) for barter against commercial office space of equivalent value in BKC or South Mumbai.',
      propertyType: 'BARTER_DEAL' as const, dealType: 'BARTER' as const,
      area: 'Andheri East', city: 'Mumbai', state: 'Maharashtra',
      priceOnRequest: true, sizeSqft: 2800, bedrooms: 4, bathrooms: 3,
      amenities: ['Parking', 'Garden', 'Security'],
      userId: broker1.id, status: 'APPROVED' as const,
      slug: 'barter-bungalow-andheri-006',
      viewCount: 156, inquiryCount: 9,
      mapUrl: 'https://www.google.com/maps/@19.1136,72.8697,15z',
      coverImage: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
        'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
      ],
    },
    {
      title: 'Distressed Sale — Office Space in BKC, Ready to Move',
      description: 'Urgent sale of 3,500 sq ft premium office space in Bandra Kurla Complex. 20% below market rate. Owner relocating abroad. Deal must close within 45 days.',
      propertyType: 'OFFICE_SPACE' as const, dealType: 'DISTRESSED' as const,
      area: 'Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra',
      price: BigInt(45000000), sizeSqft: 3500,
      amenities: ['Parking', 'Lift', 'Security', 'CCTV', 'Power Backup'],
      userId: investor.id, status: 'APPROVED' as const,
      slug: 'distressed-office-bkc-007',
      viewCount: 412, inquiryCount: 31, isBoosted: true,
      mapUrl: 'https://www.google.com/maps/@19.0660,72.8682,15z',
      brochureUrl: SAMPLE_PDF,
      coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
        'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80',
        'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80',
      ],
    },
    {
      title: '10 Acre Agricultural Land — Goa (NA Conversion Possible)',
      description: 'Prime 10-acre agricultural plot near Goa airport with conversion potential. Road access, power, and borewell on site. Suitable for resort, villa project, or weekend retreat.',
      propertyType: 'FARMLAND' as const, dealType: 'SALE' as const,
      area: 'Verna', city: 'Goa', state: 'Goa',
      price: BigInt(95000000), sizeAcres: 10,
      amenities: ['Power Backup'],
      userId: investor.id, status: 'APPROVED' as const,
      slug: 'farmland-goa-verna-008',
      viewCount: 278, inquiryCount: 19,
      mapUrl: 'https://www.google.com/maps/@15.3742,73.9286,14z',
      brochureUrl: SAMPLE_PDF,
      coverImage: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&q=80',
      ],
    },
  ]

  for (const listing of listings) {
    await db.listing.upsert({
      where: { slug: listing.slug },
      update: {
        coverImage: listing.coverImage,
        images: listing.images,
        viewCount: listing.viewCount,
        inquiryCount: listing.inquiryCount,
        status: 'APPROVED',
        expiresAt: LISTING_EXPIRY,
        mapUrl: (listing as any).mapUrl ?? null,
        brochureUrl: (listing as any).brochureUrl ?? null,
      },
      create: { ...listing, expiresAt: LISTING_EXPIRY },
    })
  }

  // CRM leads
  await db.crmLead.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      ownerId: broker1.id,
      name: 'Vikram Agarwal',
      phone: '+919876501234',
      company: 'Agarwal Investments',
      budget: BigInt(30000000),
      status: 'NEGOTIATION', source: 'REFERRAL',
      notes: 'Looking for 3BHK in Bandra or Juhu. Pre-approved loan of ₹2 Cr.',
      nextFollowUp: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  })
  await db.crmLead.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      ownerId: broker1.id,
      name: 'Sunita Kapoor',
      phone: '+919876502345',
      budget: BigInt(80000000),
      status: 'SITE_VISIT', source: 'WHATSAPP_SHARE',
      notes: 'Interested in Lonavala villa. Wants site visit this weekend.',
    },
  })
  await db.crmLead.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      ownerId: broker1.id,
      name: 'Deepak Joshi',
      phone: '+919876503456',
      company: 'Joshi & Sons',
      budget: BigInt(150000000),
      status: 'QUALIFIED', source: 'ORGANIC',
      notes: 'Looking for JV land in Pune or Nashik. Open to 1-5 acres.',
    },
  })
  await db.crmLead.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      ownerId: developer.id,
      name: 'Rahul Tiwari',
      phone: '+919876504567',
      company: 'Tiwari Corp',
      budget: BigInt(500000000),
      status: 'NEW', source: 'LANDING_PAGE',
      notes: 'Inquired via website about Hinjewadi JV land. Follow up ASAP.',
    },
  })

  // Badges
  const badges: { userId: string; badgeType: 'FIRST_DEAL' | '10_DEALS' | 'TOP_BROKER' | 'VERIFIED' }[] = [
    { userId: broker1.id, badgeType: 'VERIFIED' },
    { userId: broker1.id, badgeType: '10_DEALS' },
    { userId: broker1.id, badgeType: 'TOP_BROKER' },
    { userId: developer.id, badgeType: 'VERIFIED' },
    { userId: developer.id, badgeType: 'FIRST_DEAL' },
    { userId: investor.id, badgeType: 'VERIFIED' },
  ]
  for (const badge of badges) {
    await db.brokerBadge.upsert({
      where: { userId_badgeType: { userId: badge.userId, badgeType: badge.badgeType } },
      update: {},
      create: badge,
    })
  }

  console.log('✅ Seed complete!')
  console.log('\n📱 Test credentials (OTP: 123456 in dev):')
  console.log('  Super Admin: +91 99999 99999')
  console.log('  Broker:      +91 98765 43210  →  Rajesh Mehta')
  console.log('  Developer:   +91 98765 43211  →  Priya Sharma')
  console.log('  Investor:    +91 98765 43212  →  Amit Kapoor\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
