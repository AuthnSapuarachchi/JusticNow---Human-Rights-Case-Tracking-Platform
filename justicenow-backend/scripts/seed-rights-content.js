/**
 * Seeds the rightscategory/rightsprotection/rightsfaq tables from the content
 * that currently lives in the mobile app (src/features/know-your-rights/data/
 * rights.ts and src/i18n/translations/en.ts). Locale is always 'en' - no
 * Sinhala/Tamil content exists to seed yet.
 *
 * Idempotent: uses upsert, safe to re-run.
 */
const prisma = require('../src/config/db');

const CATEGORIES = [
  { id: 'workplace', icon: 'briefcase' },
  { id: 'child', icon: 'happy' },
  { id: 'women', icon: 'female' },
  { id: 'disability', icon: 'accessibility' },
  { id: 'privacy', icon: 'shield-checkmark' },
  { id: 'discrimination', icon: 'people' },
  { id: 'detention', icon: 'document-text' },
  { id: 'education', icon: 'school' },
  { id: 'healthcare', icon: 'medkit' },
];

const TITLES = {
  workplace: 'Workplace Rights',
  child: 'Child Rights',
  women: "Women's Rights",
  disability: 'Disability Rights',
  privacy: 'Digital Privacy',
  discrimination: 'Discrimination',
  detention: 'Unlawful Detention',
  education: 'Access to Education',
  healthcare: 'Access to Healthcare',
};

const DESCRIPTIONS = {
  workplace: 'Fair pay, safe conditions, and protection from unfair dismissal.',
  child: 'Protection from exploitation, access to education, and general welfare.',
  women: 'Gender equality, reproductive rights, and protection against violence.',
  disability: 'Equal access, reasonable accommodation, and anti-discrimination.',
  privacy: 'Data protection, surveillance laws, and online freedom of expression.',
  discrimination:
    'Protections against bias based on race, religion, language, caste, sex, political opinion, or place of birth.',
  detention: 'Rights during arrest, bail procedures, and habeas corpus.',
  education: 'Right to schooling, special education, and protection from exclusion.',
  healthcare: 'Patient rights, emergency care access, and medical privacy.',
};

const INTROS = {
  workplace:
    'Every worker is entitled to safe conditions, fair pay, and freedom from discrimination. These protections come from Sri Lankan labour law and the Constitution of Sri Lanka.',
  child:
    'Children are protected from exploitation and harm, and have the right to education and care.',
  women:
    'Women are entitled to equality before the law, protection from violence, and maternity rights at work.',
  disability:
    'People with disabilities have the right to equal access, to work, and to be free from discrimination.',
  privacy:
    'Your personal data is protected by law, and you have the right to speak freely and to ask public bodies for information.',
  discrimination:
    'Discrimination by the State on listed grounds is prohibited by the Constitution, and there is a route to remedy.',
  detention: 'If you are arrested, you have rights from the moment you are taken into custody.',
  education: 'Every child has the right to attend school and cannot be excluded on unlawful grounds.',
  healthcare: 'Care in State hospitals is free at the point of use, and your medical information is confidential.',
};

const SOURCES = {
  workplace: [
    'Constitution of Sri Lanka, Article 12(2)',
    'Shop and Office Employees Act No. 19 of 1954',
    'Wages Boards Ordinance No. 27 of 1941',
    'National Minimum Wage of Workers Act No. 3 of 2016',
    'Termination of Employment of Workmen Act No. 45 of 1971',
    'Industrial Disputes Act No. 43 of 1950',
    'Factories Ordinance No. 45 of 1942',
  ],
  child: [
    'Employment of Women, Young Persons and Children Act No. 47 of 1956',
    'National Child Protection Authority Act No. 50 of 1998',
  ],
  women: [
    'Constitution of Sri Lanka, Article 12(2)',
    'Prevention of Domestic Violence Act No. 34 of 2005',
    'Maternity Benefits Ordinance No. 32 of 1939',
  ],
  disability: [
    'Protection of the Rights of Persons with Disabilities Act No. 28 of 1996',
    'Constitution of Sri Lanka, Article 12(2)',
  ],
  privacy: [
    'Personal Data Protection Act No. 9 of 2022',
    'Right to Information Act No. 12 of 2016',
    'Constitution of Sri Lanka, Article 14(1)(a)',
  ],
  discrimination: [
    'Constitution of Sri Lanka, Article 12(2)',
    'Human Rights Commission of Sri Lanka Act No. 21 of 1996',
  ],
  detention: [
    'Constitution of Sri Lanka, Articles 13 and 141',
    'Code of Criminal Procedure Act No. 15 of 1979',
    'Bail Act No. 30 of 1997',
  ],
  education: ['Education Ordinance No. 31 of 1939', 'Constitution of Sri Lanka, Article 12(2)'],
  healthcare: ['National Health Policy', 'Personal Data Protection Act No. 9 of 2022'],
};

const PROTECTIONS = {
  workplace: [
    { id: 'wages', icon: 'cash', title: 'Minimum wage and overtime', body: 'You are entitled to at least the national minimum wage, and to the wage set by the Wages Board for your trade where one applies. Shop and office employees normally work 8 hours a day and 45 hours a week; hours beyond that are overtime and must be paid at one and a half times your normal rate.' },
    { id: 'safety', icon: 'shield-checkmark', title: 'Safety and health at work', body: 'Your employer must provide a workplace free from known hazards, along with the equipment and training to work safely. You can ask the Department of Labour to inspect your workplace, and it is unlawful to punish you for asking.' },
    { id: 'organise', icon: 'people', title: 'The right to organise', body: 'You may join or form a trade union, discuss pay and conditions with colleagues, and take part in lawful collective action. Your employer cannot dismiss or penalise you for union membership.' },
    { id: 'harassment', icon: 'ban', title: 'Protection from discrimination', body: 'Article 12(2) of the Constitution prohibits discrimination on the grounds of race, religion, language, caste, sex, political opinion or place of birth. Sexual harassment at work is also a criminal offence under the Penal Code.' },
    { id: 'dismissal', icon: 'document-text', title: 'Protection from unfair dismissal', body: 'In most workplaces with 15 or more employees, your employer cannot end your employment without either your consent or the written approval of the Commissioner of Labour. If you are dismissed unfairly you can apply to a Labour Tribunal.' },
  ],
  child: [
    { id: 'exploitation', icon: 'ban', title: 'Freedom from child labour', body: 'Employing a child below the minimum age is an offence, and young persons may not be put to hazardous work or night work.' },
    { id: 'education', icon: 'school', title: 'The right to schooling', body: 'Education is compulsory for children of school age, and a child cannot lawfully be kept from attending.' },
    { id: 'protection', icon: 'shield-checkmark', title: 'Protection from abuse', body: 'Cruelty to or exploitation of a child can be reported to the National Child Protection Authority or the police, including anonymously.' },
  ],
  women: [
    { id: 'equality', icon: 'people', title: 'Equality before the law', body: 'Article 12(2) of the Constitution prohibits discrimination on the ground of sex in any matter of public authority.' },
    { id: 'violence', icon: 'shield-checkmark', title: 'Protection from domestic violence', body: 'You can apply to a Magistrate Court for a protection order against physical or emotional abuse by a family member or partner.' },
    { id: 'maternity', icon: 'heart', title: 'Maternity rights', body: 'You are entitled to paid maternity leave and to nursing intervals on return to work, and you cannot be dismissed for taking them.' },
  ],
  disability: [
    { id: 'access', icon: 'accessibility', title: 'Access to public places', body: 'Public buildings and services must be made accessible, and being refused entry or service on the basis of disability is unlawful.' },
    { id: 'employment', icon: 'briefcase', title: 'Equal treatment at work', body: 'You cannot be refused employment, training or promotion because of a disability where you are able to do the work.' },
    { id: 'discrimination', icon: 'ban', title: 'Making a complaint', body: 'Complaints can be made to the National Secretariat for Persons with Disabilities or the Human Rights Commission of Sri Lanka.' },
  ],
  privacy: [
    { id: 'data', icon: 'lock-closed', title: 'Control over your personal data', body: 'Organisations holding your data must have a lawful basis, keep it secure, and let you access or correct it.' },
    { id: 'expression', icon: 'chatbubbles', title: 'Freedom of expression', body: 'Article 14(1)(a) of the Constitution protects speech and expression, including online, subject to limits set by law.' },
    { id: 'information', icon: 'document-text', title: 'The right to information', body: 'You can request information held by a public authority, and a refusal must be explained and can be appealed.' },
  ],
  discrimination: [
    { id: 'equality', icon: 'people', title: 'Protected grounds', body: 'Article 12(2) prohibits discrimination on the grounds of race, religion, language, caste, sex, political opinion or place of birth.' },
    { id: 'remedy', icon: 'document-text', title: 'Fundamental rights application', body: 'Where a public authority has infringed your fundamental rights, you may petition the Supreme Court. There is a strict time limit, so act quickly.' },
    { id: 'services', icon: 'business', title: 'Access to public services', body: 'Public services and State employment must be open on equal terms, without preference on any protected ground.' },
  ],
  detention: [
    { id: 'arrest', icon: 'information-circle', title: 'On arrest', body: 'You must be told the reason for your arrest, and you must be produced before a magistrate without unreasonable delay. You may inform a relative and speak to a lawyer.' },
    { id: 'bail', icon: 'document-text', title: 'Bail', body: 'Bail is the rule rather than the exception for most offences. Where it is refused, reasons must be given and the decision can be challenged.' },
    { id: 'habeas', icon: 'shield-checkmark', title: 'Unlawful detention', body: 'If someone is being held unlawfully, an application for habeas corpus can be made to the Court of Appeal to require that they be produced.' },
  ],
  education: [
    { id: 'access', icon: 'school', title: 'Free education', body: 'State education is free, and admission cannot be conditioned on payments outside those the school is permitted to charge.' },
    { id: 'exclusion', icon: 'ban', title: 'Protection from exclusion', body: 'A child cannot be refused admission or removed on the grounds of ethnicity, religion, language or a parent’s circumstances.' },
    { id: 'special', icon: 'accessibility', title: 'Special educational needs', body: 'Children with disabilities are entitled to schooling with reasonable support rather than being turned away.' },
  ],
  healthcare: [
    { id: 'access', icon: 'medkit', title: 'Access to care', body: 'Treatment in State hospitals is provided free of charge, and care cannot be refused on the ground of ethnicity, religion or ability to pay.' },
    { id: 'emergency', icon: 'pulse', title: 'Emergency treatment', body: 'Emergency care must be given first; questions of documents or payment cannot come before urgent treatment.' },
    { id: 'privacy', icon: 'lock-closed', title: 'Medical confidentiality', body: 'Your medical records are personal data. They cannot be shared without your consent except where the law requires it.' },
  ],
};

const FAQS = {
  workplace: [
    { id: 'unsafe', question: 'Can I be dismissed for reporting unsafe conditions?', answer: 'No. Retaliating against an employee who raises a safety or health concern is unlawful. Keep a record of what you reported and when, then raise it with the Department of Labour.' },
    { id: 'contractor', question: 'What if I am treated as an independent contractor?', answer: 'What matters is the reality of the relationship, not the label on your agreement. If your employer controls how, when and where you work, and you are integrated into their business, a Labour Tribunal may find you are an employee entitled to the full protections regardless of what the contract says.' },
    { id: 'overtime', question: 'Is there a limit on how much overtime I can be asked to work?', answer: 'Yes. Overtime for shop and office employees is capped at twelve hours in any one week, and it must be paid at the overtime rate. Being asked to work beyond that limit is a matter you can raise with the Department of Labour.' },
  ],
  child: [
    { id: 'minimumAge', question: 'What is the minimum age for a child to work?', answer: 'Employing a child under 14 is generally prohibited. Young persons between 14 and 18 may not be put to hazardous work or work at night, even where employment is otherwise permitted.' },
    { id: 'reportAbuse', question: 'How do I report suspected child abuse?', answer: 'You can contact the National Child Protection Authority or the police. A report can be made anonymously, and the authority is required to look into it.' },
    { id: 'corporalPunishment', question: 'Is corporal punishment allowed in schools?', answer: 'No. Corporal punishment is prohibited in government schools. An incident can be raised with the school administration or reported to the National Child Protection Authority.' },
  ],
  women: [
    { id: 'protectionOrder', question: 'How do I get protection from an abusive partner?', answer: 'You can apply to a Magistrate Court under the Prevention of Domestic Violence Act. The court can issue an interim protection order quickly while your full application is heard.' },
    { id: 'workplaceHarassment', question: 'What can I do about harassment at work?', answer: 'Sexual harassment is a criminal offence under the Penal Code. You can raise it with your employer, report it to the police, or bring a complaint to the Human Rights Commission of Sri Lanka.' },
    { id: 'maternityDismissal', question: 'Can I be dismissed for being pregnant or on maternity leave?', answer: 'No. The Maternity Benefits Ordinance protects you from dismissal during pregnancy and maternity leave. A dismissal on this ground can be challenged.' },
  ],
  disability: [
    { id: 'accessRefusal', question: 'What can I do if I am refused entry somewhere because of my disability?', answer: 'This may breach the Protection of the Rights of Persons with Disabilities Act. You can complain to the National Secretariat for Persons with Disabilities.' },
    { id: 'employmentQuota', question: 'Does Sri Lanka require employers to hire people with disabilities?', answer: 'State institutions are required to reserve a share of employment for persons with disabilities. Private employers are encouraged to do the same under the Act.' },
    { id: 'reasonableAccommodation', question: 'Can my employer refuse to make reasonable adjustments?', answer: 'Refusing a reasonable adjustment without good reason can amount to discrimination, which you can raise with the Human Rights Commission of Sri Lanka.' },
  ],
  privacy: [
    { id: 'dataMisuse', question: 'What can I do if a company misuses my personal data?', answer: 'Under the Personal Data Protection Act, organisations must have a lawful basis to process your data and keep it secure. Complaints are handled by the Data Protection Authority.' },
    { id: 'onlineHarassment', question: 'What can I do about online harassment or defamation?', answer: 'You can report it to the CID Cyber Crime Division. Depending on the nature of the harassment, it may also fall under the Computer Crimes Act.' },
    { id: 'infoRequest', question: 'How do I request information from a government office?', answer: 'File a request under the Right to Information Act. The authority must respond within the statutory time limit, or give reasons for refusing.' },
  ],
  discrimination: [
    { id: 'timeLimit', question: 'How long do I have to challenge discrimination by a state authority?', answer: 'A fundamental rights petition to the Supreme Court must generally be filed within one month of the infringement, so it is important to act quickly.' },
    { id: 'privateEmployer', question: 'Does the Constitution protect me from discrimination by a private employer?', answer: 'Article 12 mainly binds the State. Discrimination by a private employer is better addressed through labour law or a complaint to the Human Rights Commission of Sri Lanka.' },
    { id: 'evidenceNeeded', question: 'What evidence helps a discrimination complaint?', answer: 'Keep a record of what happened, when, and any witnesses. Written communications, such as messages or emails, are also useful evidence.' },
  ],
  detention: [
    { id: 'rightsOnArrest', question: 'What are my rights immediately after arrest?', answer: 'You must be told the reason for your arrest, produced before a magistrate without unreasonable delay, and allowed to inform a relative and speak to a lawyer.' },
    { id: 'bailRefused', question: 'What happens if bail is refused?', answer: 'Reasons must be given for refusing bail, and the decision can be challenged before a higher court.' },
    { id: 'habeasCorpusUse', question: 'When would I use a habeas corpus application?', answer: 'When a person is being held and their whereabouts are unclear, or they have not been produced before a court. The application can require that they be produced.' },
  ],
  education: [
    { id: 'schoolFees', question: 'Can a government school demand payment to admit my child?', answer: 'No. State education is free, and admission cannot be conditioned on payments the school is not legally permitted to charge.' },
    { id: 'expulsion', question: 'Can my child be expelled without a hearing?', answer: 'No. Due process should be followed before a child is excluded from school. An unfair exclusion can be raised with the zonal education office.' },
    { id: 'specialNeeds', question: 'What support exists for a child with a disability in mainstream school?', answer: 'A child with a disability is entitled to reasonable support rather than being turned away. Provision varies by school, and concerns can be raised with the Ministry of Education.' },
  ],
  healthcare: [
    { id: 'refusedTreatment', question: 'Can a government hospital refuse me treatment?', answer: 'No. Care cannot be refused on the ground of ethnicity, religion, or ability to pay, and emergency treatment must be given first regardless of documents or payment.' },
    { id: 'medicalRecordsPrivacy', question: 'Who can access my medical records?', answer: 'Your medical records are personal data. They cannot be shared without your consent, except where the law requires it, such as a court order or public health reporting.' },
    { id: 'complaintProcess', question: 'How do I complain about poor treatment at a hospital?', answer: 'You can raise it with the hospital administration, the Ministry of Health, or the Human Rights Commission of Sri Lanka.' },
  ],
};

async function main() {
  for (const { id: categoryId, icon } of CATEGORIES) {
    const category = await prisma.rightsCategory.upsert({
      where: { categoryId_locale: { categoryId, locale: 'en' } },
      update: {
        icon,
        title: TITLES[categoryId],
        description: DESCRIPTIONS[categoryId],
        intro: INTROS[categoryId],
        sources: SOURCES[categoryId].join('\n'),
      },
      create: {
        categoryId,
        locale: 'en',
        icon,
        title: TITLES[categoryId],
        description: DESCRIPTIONS[categoryId],
        intro: INTROS[categoryId],
        sources: SOURCES[categoryId].join('\n'),
      },
    });

    for (const [index, protection] of PROTECTIONS[categoryId].entries()) {
      const existing = await prisma.rightsProtection.findFirst({
        where: { categoryId: category.id, protectionId: protection.id },
      });
      const data = { icon: protection.icon, title: protection.title, body: protection.body, order: index };
      if (existing) {
        await prisma.rightsProtection.update({ where: { id: existing.id }, data });
      } else {
        await prisma.rightsProtection.create({
          data: { ...data, protectionId: protection.id, categoryId: category.id },
        });
      }
    }

    for (const [index, faq] of FAQS[categoryId].entries()) {
      const existing = await prisma.rightsFaq.findFirst({
        where: { categoryId: category.id, faqId: faq.id },
      });
      const data = { question: faq.question, answer: faq.answer, order: index };
      if (existing) {
        await prisma.rightsFaq.update({ where: { id: existing.id }, data });
      } else {
        await prisma.rightsFaq.create({ data: { ...data, faqId: faq.id, categoryId: category.id } });
      }
    }

    console.log(`Seeded ${categoryId}: ${PROTECTIONS[categoryId].length} protections, ${FAQS[categoryId].length} FAQs`);
  }

  console.log('\nRights content seeded.');
}

main()
  .catch((error) => {
    console.error('Unable to seed rights content:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
