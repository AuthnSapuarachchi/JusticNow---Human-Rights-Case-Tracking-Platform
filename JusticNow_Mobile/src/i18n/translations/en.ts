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
