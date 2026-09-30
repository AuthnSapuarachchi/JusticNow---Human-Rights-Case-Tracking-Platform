/**
 * English strings — the canonical dictionary.
 *
 * This file defines the key set for the whole app: `TranslationKey` is derived
 * from it, so adding a key here and nowhere else is safe (other languages fall
 * back to English), but using a key that is NOT here is a compile error.
 *
 * Keys are namespaced by screen or concern. Keep them alphabetical within a
 * namespace so merge conflicts stay small.
 */

export const en = {
  // ---- shared chrome -------------------------------------------------------
  'common.appName': 'JusticeNow',
  'common.back': 'Go back',
  'common.cancel': 'Cancel',
  'common.error': 'Something went wrong. Please try again.',
  'common.loading': 'Loading…',
  'common.notifications': 'Notifications',
  'common.retry': 'Try again',
  'common.search': 'Search',
  'common.viewAll': 'View all',

  'nav.home': 'Home',
  'nav.cases': 'Cases',
  'nav.messages': 'Messages',
  'nav.support': 'Support',

  'language.select': 'Choose a language',

  // ---- EP-06 Legal Support Directory (US-13) -------------------------------
  'directory.title': 'Find Legal Help',
  'directory.searchPlaceholder': 'Search organizations or locations',
  'directory.searchLabel': 'Search legal organizations by name or location',
  'directory.filterAll': 'All services',
  /** The cost row's "all" chip — deliberately just "All", not "All services",
   *  so it doesn't repeat the category row's label above it. */
  'directory.costAll': 'All',
  'directory.filterFree': 'Free services',
  'directory.filterLegalAid': 'Legal aid',
  'directory.filterHumanRights': 'Human rights',
  'directory.verified': 'Verified',
  'directory.distance': '{{km}} km away',
  'directory.languages': 'Languages: {{languages}}',
  'directory.requestSupport': 'Request support',
  'directory.free': 'Free',
  'directory.paid': 'Paid',
  'directory.empty': 'No organisations match your filters.',
  'directory.emptyHint': 'Try removing a filter or searching a different area.',
  'directory.resultCount': '{{count}} organisations',
  'directory.resultCountOne': '1 organisation',
  'directory.filterLanguage': 'Language',
  'directory.filterCost': 'Cost',
  'directory.anyLanguage': 'Any language',
  'directory.unverified': 'Not yet verified',
  'directory.callLabel': 'Call {{name}}',
  'directory.emailLabel': 'Email {{name}}',

  // Organisation category tags. Ids come from the API; labels are translated.
  'category.legalAid': 'Legal aid',
  'category.humanRights': 'Human rights',
  'category.workplaceRights': 'Workplace rights',
  'category.womensRights': "Women's rights",
  'category.childRights': 'Child rights',
  'category.counselling': 'Counselling',
  'category.landRights': 'Land rights',

  // Language names as they appear in an organisation's "speaks" list.
  'lang.si': 'Sinhala',
  'lang.ta': 'Tamil',
  'lang.en': 'English',

  // ---- EP-06 Request Support (US-14) ---------------------------------------
  'request.title': 'Request Support',
  'request.relatedCase': 'Select related case (optional)',
  'request.selectCase': 'Select a case from your dashboard',
  'request.supportType': 'Type of support needed',
  'request.legalAdvice': 'Legal advice',
  'request.representation': 'Representation',
  'request.documentReview': 'Document review',
  'request.strategicConsultation': 'Strategic consultation',
  'request.message': 'Message to organisation',
  'request.messagePlaceholder':
    'Briefly describe your situation and any specific questions. Please do not include highly sensitive personal details here.',
  'request.privacyTitle': 'Data privacy and sharing',
  'request.privacyBody':
    'By submitting this request you authorise JusticeNow to share your basic profile information and the selected case details with {{organisation}}. Your data remains encrypted end to end.',
  'request.consent': 'I consent to sharing my report and evidence with this organisation.',
  'request.consentLabel': 'Consent to sharing',
  'request.send': 'Send request',
  'request.sending': 'Sending your request…',
  'request.sent': 'Request sent',
  'request.consentRequired': 'Please give consent before sending your request.',
  'request.messageRequired': 'Please describe your situation before sending.',

  // ---- EP-07 Know Your Rights (US-15) --------------------------------------
  'rights.title': 'Know Your Rights',
  'rights.intro':
    'Clear, plain-language information about your legal rights and protections. Search below or explore the categories.',
  'rights.searchPlaceholder': 'Search rights, topics, or situations',
  'rights.searchLabel': 'Search rights information',
  'rights.categories': 'Categories',
  'rights.featuredGuides': 'Featured guides',
  'rights.readGuide': 'Read guide',
  'rights.urgentGuide': 'Urgent guide',
  'rights.keyProtections': 'Key protections',
  'rights.faq': 'Frequently asked questions',
  'rights.violatedTitle': 'Rights violated?',
  'rights.violatedBody':
    'If you believe your rights have been violated, document everything. Keep records of communications, dates, and witnesses. You can report an incident securely through JusticeNow to receive guidance.',
  'rights.reportIncident': 'Report an incident',

  // Category names and their plain-language descriptions.
  'rights.category.workplace': 'Workplace Rights',
  'rights.category.workplace.desc': 'Fair pay, safe conditions, and protection from unfair dismissal.',
  'rights.category.child': 'Child Rights',
  'rights.category.child.desc': 'Protection from exploitation, access to education, and general welfare.',
  'rights.category.women': "Women's Rights",
  'rights.category.women.desc': 'Gender equality, reproductive rights, and protection against violence.',
  'rights.category.disability': 'Disability Rights',
  'rights.category.disability.desc': 'Equal access, reasonable accommodation, and anti-discrimination.',
  'rights.category.privacy': 'Digital Privacy',
  'rights.category.privacy.desc': 'Data protection, surveillance laws, and online freedom of expression.',
  'rights.category.discrimination': 'Discrimination',
  'rights.category.discrimination.desc':
    'Protection against bias based on race, religion, language, caste, sex, political opinion, or place of birth.',
  'rights.category.detention': 'Unlawful Detention',
  'rights.category.detention.desc': 'Your rights during arrest, bail procedures, and habeas corpus.',
  'rights.category.education': 'Access to Education',
  'rights.category.education.desc': 'The right to schooling, special education, and protection from exclusion.',
  'rights.category.healthcare': 'Access to Healthcare',
  'rights.category.healthcare.desc': 'Patient rights, emergency care access, and medical privacy.',

  // ---- rights detail pages -------------------------------------------------
  'rights.sources': 'Based on',
  'rights.disclaimer':
    'This is general information about Sri Lankan law, not legal advice. For advice about your own situation, contact a legal-aid organisation through Find Legal Help.',
  'rights.findHelp': 'Find legal help',
  'rights.contentComing': 'Detailed guidance for this topic is being written.',

  // Workplace — the fully written example. Sri Lankan law throughout.
  'rights.detail.workplace.intro':
    'Every worker is entitled to safe conditions, fair pay, and freedom from discrimination. These protections come from Sri Lankan labour law and the Constitution of Sri Lanka.',
  'rights.detail.workplace.protection.wages.title': 'Minimum wage and overtime',
  'rights.detail.workplace.protection.wages.body':
    'You are entitled to at least the national minimum wage, and to the wage set by the Wages Board for your trade where one applies. Shop and office employees normally work 8 hours a day and 45 hours a week; hours beyond that are overtime and must be paid at one and a half times your normal rate.',
  'rights.detail.workplace.protection.safety.title': 'Safety and health at work',
  'rights.detail.workplace.protection.safety.body':
    'Your employer must provide a workplace free from known hazards, along with the equipment and training to work safely. You can ask the Department of Labour to inspect your workplace, and it is unlawful to punish you for asking.',
  'rights.detail.workplace.protection.organise.title': 'The right to organise',
  'rights.detail.workplace.protection.organise.body':
    'You may join or form a trade union, discuss pay and conditions with colleagues, and take part in lawful collective action. Your employer cannot dismiss or penalise you for union membership.',
  'rights.detail.workplace.protection.harassment.title': 'Protection from discrimination',
  'rights.detail.workplace.protection.harassment.body':
    'Article 12(2) of the Constitution prohibits discrimination on the grounds of race, religion, language, caste, sex, political opinion or place of birth. Sexual harassment at work is also a criminal offence under the Penal Code.',
  'rights.detail.workplace.protection.dismissal.title': 'Protection from unfair dismissal',
  'rights.detail.workplace.protection.dismissal.body':
    'In most workplaces with 15 or more employees, your employer cannot end your employment without either your consent or the written approval of the Commissioner of Labour. If you are dismissed unfairly you can apply to a Labour Tribunal.',

  'rights.detail.workplace.faq.unsafe.q': 'Can I be dismissed for reporting unsafe conditions?',
  'rights.detail.workplace.faq.unsafe.a':
    'No. Retaliating against an employee who raises a safety or health concern is unlawful. Keep a record of what you reported and when, then raise it with the Department of Labour.',
  'rights.detail.workplace.faq.contractor.q': 'What if I am treated as an independent contractor?',
  'rights.detail.workplace.faq.contractor.a':
    'What matters is the reality of the relationship, not the label on your agreement. If your employer controls how, when and where you work, and you are integrated into their business, a Labour Tribunal may find you are an employee entitled to the full protections regardless of what the contract says.',
  'rights.detail.workplace.faq.overtime.q': 'Is there a limit on how much overtime I can be asked to work?',
  'rights.detail.workplace.faq.overtime.a':
    'Yes. Overtime for shop and office employees is capped at twelve hours in any one week, and it must be paid at the overtime rate. Being asked to work beyond that limit is a matter you can raise with the Department of Labour.',

  // Child Rights — JN-60
  'rights.detail.child.faq.minimumAge.q': 'What is the minimum age for a child to work?',
  'rights.detail.child.faq.minimumAge.a':
    'Employing a child under 14 is generally prohibited. Young persons between 14 and 18 may not be put to hazardous work or work at night, even where employment is otherwise permitted.',
  'rights.detail.child.faq.reportAbuse.q': 'How do I report suspected child abuse?',
  'rights.detail.child.faq.reportAbuse.a':
    'You can contact the National Child Protection Authority or the police. A report can be made anonymously, and the authority is required to look into it.',
  'rights.detail.child.faq.corporalPunishment.q': 'Is corporal punishment allowed in schools?',
  'rights.detail.child.faq.corporalPunishment.a':
    'No. Corporal punishment is prohibited in government schools. An incident can be raised with the school administration or reported to the National Child Protection Authority.',

  // Women's Rights — JN-60
  'rights.detail.women.faq.protectionOrder.q': 'How do I get protection from an abusive partner?',
  'rights.detail.women.faq.protectionOrder.a':
    'You can apply to a Magistrate Court under the Prevention of Domestic Violence Act. The court can issue an interim protection order quickly while your full application is heard.',
  'rights.detail.women.faq.workplaceHarassment.q': 'What can I do about harassment at work?',
  'rights.detail.women.faq.workplaceHarassment.a':
    'Sexual harassment is a criminal offence under the Penal Code. You can raise it with your employer, report it to the police, or bring a complaint to the Human Rights Commission of Sri Lanka.',
  'rights.detail.women.faq.maternityDismissal.q': 'Can I be dismissed for being pregnant or on maternity leave?',
  'rights.detail.women.faq.maternityDismissal.a':
    'No. The Maternity Benefits Ordinance protects you from dismissal during pregnancy and maternity leave. A dismissal on this ground can be challenged.',

  // Disability Rights — JN-60
  'rights.detail.disability.faq.accessRefusal.q': 'What can I do if I am refused entry somewhere because of my disability?',
  'rights.detail.disability.faq.accessRefusal.a':
    'This may breach the Protection of the Rights of Persons with Disabilities Act. You can complain to the National Secretariat for Persons with Disabilities.',
  'rights.detail.disability.faq.employmentQuota.q': 'Does Sri Lanka require employers to hire people with disabilities?',
  'rights.detail.disability.faq.employmentQuota.a':
    'State institutions are required to reserve a share of employment for persons with disabilities. Private employers are encouraged to do the same under the Act.',
  'rights.detail.disability.faq.reasonableAccommodation.q': 'Can my employer refuse to make reasonable adjustments?',
  'rights.detail.disability.faq.reasonableAccommodation.a':
    'Refusing a reasonable adjustment without good reason can amount to discrimination, which you can raise with the Human Rights Commission of Sri Lanka.',

  // Digital Privacy — JN-60
  'rights.detail.privacy.faq.dataMisuse.q': 'What can I do if a company misuses my personal data?',
  'rights.detail.privacy.faq.dataMisuse.a':
    'Under the Personal Data Protection Act, organisations must have a lawful basis to process your data and keep it secure. Complaints are handled by the Data Protection Authority.',
  'rights.detail.privacy.faq.onlineHarassment.q': 'What can I do about online harassment or defamation?',
  'rights.detail.privacy.faq.onlineHarassment.a':
    'You can report it to the CID Cyber Crime Division. Depending on the nature of the harassment, it may also fall under the Computer Crimes Act.',
  'rights.detail.privacy.faq.infoRequest.q': 'How do I request information from a government office?',
  'rights.detail.privacy.faq.infoRequest.a':
    'File a request under the Right to Information Act. The authority must respond within the statutory time limit, or give reasons for refusing.',

  // Discrimination — JN-60
  'rights.detail.discrimination.faq.timeLimit.q': 'How long do I have to challenge discrimination by a state authority?',
  'rights.detail.discrimination.faq.timeLimit.a':
    'A fundamental rights petition to the Supreme Court must generally be filed within one month of the infringement, so it is important to act quickly.',
  'rights.detail.discrimination.faq.privateEmployer.q': 'Does the Constitution protect me from discrimination by a private employer?',
  'rights.detail.discrimination.faq.privateEmployer.a':
    'Article 12 mainly binds the State. Discrimination by a private employer is better addressed through labour law or a complaint to the Human Rights Commission of Sri Lanka.',
  'rights.detail.discrimination.faq.evidenceNeeded.q': 'What evidence helps a discrimination complaint?',
  'rights.detail.discrimination.faq.evidenceNeeded.a':
    'Keep a record of what happened, when, and any witnesses. Written communications, such as messages or emails, are also useful evidence.',

  // Unlawful Detention — JN-60
  'rights.detail.detention.faq.rightsOnArrest.q': 'What are my rights immediately after arrest?',
  'rights.detail.detention.faq.rightsOnArrest.a':
    'You must be told the reason for your arrest, produced before a magistrate without unreasonable delay, and allowed to inform a relative and speak to a lawyer.',
  'rights.detail.detention.faq.bailRefused.q': 'What happens if bail is refused?',
  'rights.detail.detention.faq.bailRefused.a':
    'Reasons must be given for refusing bail, and the decision can be challenged before a higher court.',
  'rights.detail.detention.faq.habeasCorpusUse.q': 'When would I use a habeas corpus application?',
  'rights.detail.detention.faq.habeasCorpusUse.a':
    'When a person is being held and their whereabouts are unclear, or they have not been produced before a court. The application can require that they be produced.',

  // Access to Education — JN-60
  'rights.detail.education.faq.schoolFees.q': 'Can a government school demand payment to admit my child?',
  'rights.detail.education.faq.schoolFees.a':
    'No. State education is free, and admission cannot be conditioned on payments the school is not legally permitted to charge.',
  'rights.detail.education.faq.expulsion.q': 'Can my child be expelled without a hearing?',
  'rights.detail.education.faq.expulsion.a':
    'No. Due process should be followed before a child is excluded from school. An unfair exclusion can be raised with the zonal education office.',
  'rights.detail.education.faq.specialNeeds.q': 'What support exists for a child with a disability in mainstream school?',
  'rights.detail.education.faq.specialNeeds.a':
    'A child with a disability is entitled to reasonable support rather than being turned away. Provision varies by school, and concerns can be raised with the Ministry of Education.',

  // Access to Healthcare — JN-60
  'rights.detail.healthcare.faq.refusedTreatment.q': 'Can a government hospital refuse me treatment?',
  'rights.detail.healthcare.faq.refusedTreatment.a':
    'No. Care cannot be refused on the ground of ethnicity, religion, or ability to pay, and emergency treatment must be given first regardless of documents or payment.',
  'rights.detail.healthcare.faq.medicalRecordsPrivacy.q': 'Who can access my medical records?',
  'rights.detail.healthcare.faq.medicalRecordsPrivacy.a':
    'Your medical records are personal data. They cannot be shared without your consent, except where the law requires it, such as a court order or public health reporting.',
  'rights.detail.healthcare.faq.complaintProcess.q': 'How do I complain about poor treatment at a hospital?',
  'rights.detail.healthcare.faq.complaintProcess.a':
    'You can raise it with the hospital administration, the Ministry of Health, or the Human Rights Commission of Sri Lanka.',

  // Remaining categories — intro and key protections. Full depth lands in JN-60.
  'rights.detail.child.intro':
    'Children are protected from exploitation and harm, and have the right to education and care.',
  'rights.detail.child.protection.exploitation.title': 'Freedom from child labour',
  'rights.detail.child.protection.exploitation.body':
    'Employing a child below the minimum age is an offence, and young persons may not be put to hazardous work or night work.',
  'rights.detail.child.protection.education.title': 'The right to schooling',
  'rights.detail.child.protection.education.body':
    'Education is compulsory for children of school age, and a child cannot lawfully be kept from attending.',
  'rights.detail.child.protection.protection.title': 'Protection from abuse',
  'rights.detail.child.protection.protection.body':
    'Cruelty to or exploitation of a child can be reported to the National Child Protection Authority or the police, including anonymously.',

  'rights.detail.women.intro':
    'Women are entitled to equality before the law, protection from violence, and maternity rights at work.',
  'rights.detail.women.protection.equality.title': 'Equality before the law',
  'rights.detail.women.protection.equality.body':
    'Article 12(2) of the Constitution prohibits discrimination on the ground of sex in any matter of public authority.',
  'rights.detail.women.protection.violence.title': 'Protection from domestic violence',
  'rights.detail.women.protection.violence.body':
    'You can apply to a Magistrate Court for a protection order against physical or emotional abuse by a family member or partner.',
  'rights.detail.women.protection.maternity.title': 'Maternity rights',
  'rights.detail.women.protection.maternity.body':
    'You are entitled to paid maternity leave and to nursing intervals on return to work, and you cannot be dismissed for taking them.',

  'rights.detail.disability.intro':
    'People with disabilities have the right to equal access, to work, and to be free from discrimination.',
  'rights.detail.disability.protection.access.title': 'Access to public places',
  'rights.detail.disability.protection.access.body':
    'Public buildings and services must be made accessible, and being refused entry or service on the basis of disability is unlawful.',
  'rights.detail.disability.protection.employment.title': 'Equal treatment at work',
  'rights.detail.disability.protection.employment.body':
    'You cannot be refused employment, training or promotion because of a disability where you are able to do the work.',
  'rights.detail.disability.protection.discrimination.title': 'Making a complaint',
  'rights.detail.disability.protection.discrimination.body':
    'Complaints can be made to the National Secretariat for Persons with Disabilities or the Human Rights Commission of Sri Lanka.',

  'rights.detail.privacy.intro':
    'Your personal data is protected by law, and you have the right to speak freely and to ask public bodies for information.',
  'rights.detail.privacy.protection.data.title': 'Control over your personal data',
  'rights.detail.privacy.protection.data.body':
    'Organisations holding your data must have a lawful basis, keep it secure, and let you access or correct it.',
  'rights.detail.privacy.protection.expression.title': 'Freedom of expression',
  'rights.detail.privacy.protection.expression.body':
    'Article 14(1)(a) of the Constitution protects speech and expression, including online, subject to limits set by law.',
  'rights.detail.privacy.protection.information.title': 'The right to information',
  'rights.detail.privacy.protection.information.body':
    'You can request information held by a public authority, and a refusal must be explained and can be appealed.',

  'rights.detail.discrimination.intro':
    'Discrimination by the State on listed grounds is prohibited by the Constitution, and there is a route to remedy.',
  'rights.detail.discrimination.protection.equality.title': 'Protected grounds',
  'rights.detail.discrimination.protection.equality.body':
    'Article 12(2) prohibits discrimination on the grounds of race, religion, language, caste, sex, political opinion or place of birth.',
  'rights.detail.discrimination.protection.remedy.title': 'Fundamental rights application',
  'rights.detail.discrimination.protection.remedy.body':
    'Where a public authority has infringed your fundamental rights, you may petition the Supreme Court. There is a strict time limit, so act quickly.',
  'rights.detail.discrimination.protection.services.title': 'Access to public services',
  'rights.detail.discrimination.protection.services.body':
    'Public services and State employment must be open on equal terms, without preference on any protected ground.',

  'rights.detail.detention.intro':
    'If you are arrested, you have rights from the moment you are taken into custody.',
  'rights.detail.detention.protection.arrest.title': 'On arrest',
  'rights.detail.detention.protection.arrest.body':
    'You must be told the reason for your arrest, and you must be produced before a magistrate without unreasonable delay. You may inform a relative and speak to a lawyer.',
  'rights.detail.detention.protection.bail.title': 'Bail',
  'rights.detail.detention.protection.bail.body':
    'Bail is the rule rather than the exception for most offences. Where it is refused, reasons must be given and the decision can be challenged.',
  'rights.detail.detention.protection.habeas.title': 'Unlawful detention',
  'rights.detail.detention.protection.habeas.body':
    'If someone is being held unlawfully, an application for habeas corpus can be made to the Court of Appeal to require that they be produced.',

  'rights.detail.education.intro':
    'Every child has the right to attend school and cannot be excluded on unlawful grounds.',
  'rights.detail.education.protection.access.title': 'Free education',
  'rights.detail.education.protection.access.body':
    'State education is free, and admission cannot be conditioned on payments outside those the school is permitted to charge.',
  'rights.detail.education.protection.exclusion.title': 'Protection from exclusion',
  'rights.detail.education.protection.exclusion.body':
    'A child cannot be refused admission or removed on the grounds of ethnicity, religion, language or a parent’s circumstances.',
  'rights.detail.education.protection.special.title': 'Special educational needs',
  'rights.detail.education.protection.special.body':
    'Children with disabilities are entitled to schooling with reasonable support rather than being turned away.',

  'rights.detail.healthcare.intro':
    'Care in State hospitals is free at the point of use, and your medical information is confidential.',
  'rights.detail.healthcare.protection.access.title': 'Access to care',
  'rights.detail.healthcare.protection.access.body':
    'Treatment in State hospitals is provided free of charge, and care cannot be refused on the ground of ethnicity, religion or ability to pay.',
  'rights.detail.healthcare.protection.emergency.title': 'Emergency treatment',
  'rights.detail.healthcare.protection.emergency.body':
    'Emergency care must be given first; questions of documents or payment cannot come before urgent treatment.',
  'rights.detail.healthcare.protection.privacy.title': 'Medical confidentiality',
  'rights.detail.healthcare.protection.privacy.body':
    'Your medical records are personal data. They cannot be shared without your consent except where the law requires it.',
};

export type TranslationKey = keyof typeof en;
