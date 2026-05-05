export function useJsonLd(schema: Record<string, any> | Record<string, any>[]) {
  const schemaArray = Array.isArray(schema) ? schema : [schema]

  useHead({
    script: schemaArray.map((s) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(s),
    })),
  })
}

export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SportsActivityLocation'],
    '@id': 'https://trainingyarddsm.com/#business',
    name: 'The Training Yard',
    description: 'Des Moines\' premier 6,000 sq ft indoor sports facility featuring 4 retractable batting cages and full synthetic turf for baseball, softball, soccer, and agility training.',
    url: 'https://trainingyarddsm.com',
    telephone: '+1-515-802-1457',
    email: 'info@trainingyarddsm.com',
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2519 NW 66th Ave',
      addressLocality: 'Des Moines',
      addressRegion: 'IA',
      postalCode: '50313',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 41.5868,
      longitude: -93.6250,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '06:00',
        closes: '22:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '08:00',
        closes: '20:00',
      },
    ],
    image: 'https://trainingyarddsm.com/images/Training_Yard_Facility_homepage.jpg',
    logo: 'https://trainingyarddsm.com/images/logo.jpg',
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Training Yard Services',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Batting Cage Rentals',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Single Batting Cage Rental',
                description: 'Rent one of four professional-grade indoor batting cages for individual practice.',
              },
            },
          ],
        },
        {
          '@type': 'OfferCatalog',
          name: 'Turf Rentals',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Full Turf Team Rental',
                description: 'Rent the full 60\' × 100\' indoor synthetic turf field for team practices and drills.',
              },
            },
          ],
        },
      ],
    },
  }
}

export function getServiceSchema(name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'LocalBusiness',
      '@id': 'https://trainingyarddsm.com/#business',
      name: 'The Training Yard',
    },
    areaServed: {
      '@type': 'City',
      name: 'Des Moines',
      containedInPlace: {
        '@type': 'State',
        name: 'Iowa',
      },
    },
  }
}

export function getFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
