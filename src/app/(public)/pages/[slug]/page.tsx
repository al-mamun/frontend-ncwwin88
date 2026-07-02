/**
 * Public CMS page (Terms, Privacy, About, …).
 *
 * Renders a single PUBLISHED page resolved by slug from the /public/cms surface,
 * scoped to the current tenant. Wrapped in the active theme's PublicLayout so the
 * site header/footer match the rest of the public site. Page body is authored by
 * the tenant admin in the dashboard CMS and rendered as HTML.
 */

'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../../core/theme/ThemeProvider';
import { useTenant } from '../../../../core/tenant/TenantProvider';
import { getThemeComponents } from '../../../../themes/components';
import { cmsApi } from '../../../../services/cms.service';
import { useI18n } from '../../../../core/i18n/LanguageProvider';

const FALLBACK_PAGES: Record<string, { title: string; body: string; titleBn?: string; bodyBn?: string }> = {
  'about-us': {
    title: 'About Us',
    body: `
      <p class="text-center">
          <a href="https://mcwbangladesh.co.com/" target="_blank" style="color: #b69853;">Mega Casino World (MCW)</a> is a leading online gaming website, offering sports betting, online casino, and online games. We have been serving the Asia Pacific market since 2015. We are fully licensed and regulated in various jurisdictions as stated in the Terms and Conditions and MCW operates strictly within these regulations.</p>

      <p class="text-center">
          The safe and private environment and the integrity of our products are the fundamental drivers of the MCW online gaming experience. We have the most advanced security measures available and are continually auditing our games and processes to ensure a totally safe and fair internet gambling experience. We keep all your information confidential, and we will never share it or sell it to third parties, except in accordance with our Privacy Policy.</p>

      <p class="text-center">
          We strive to offer the best prices whilst covering a wide variety of sporting markets and other worldwide sporting events. We provide a wide variety of live games and slot games in our casino. At MCW we promise you will enjoy the highest class of online gaming entertainment of the world.</p>

      <p class="text-center">
          With 24 hour live customer support available 7 days per week, our highly trained and friendly staff will ensure that any queries are dealt with and resolved quickly, politely, and efficiently. 
      </p>

      <p class="text-center">
          Our mission is to provide the best online gambling experience for responsible players, please feel free to contact us by phone or email with your comments or suggestions.</p>

      <p class="text-center">
          We offer a variety of secure and easy payment methods for your convenience. We adhere to “know your customer (KYC)” and anti-money laundering (AML) policies and cooperate with the third party financial and regulatory authorities to ensure the highest standards of compliance. 
      </p>
    `,
    titleBn: 'আমাদের সম্পর্কে',
    bodyBn: `
      <p class="text-center"><a href="https://mcwbangladesh.co.com/" target="_blank" style="color: #b69853;">মেগা ক্যাসিনো ওয়ার্ল্ড (MCW)</a> একটি শীর্ষস্থানীয় অনলাইন গেমিং ওয়েবসাইট, যা স্পোর্টস বেটিং, অনলাইন ক্যাসিনো ও অনলাইন গেম অফার করে। আমরা ২০১৫ সাল থেকে এশিয়া প্যাসিফিক বাজারে সেবা দিয়ে আসছি। শর্তাবলীতে উল্লিখিত বিভিন্ন এখতিয়ারে আমরা সম্পূর্ণরূপে লাইসেন্সপ্রাপ্ত ও নিয়ন্ত্রিত, এবং MCW কঠোরভাবে এই নিয়মের মধ্যেই পরিচালিত হয়।</p>
      <p class="text-center">নিরাপদ ও গোপনীয় পরিবেশ এবং আমাদের পণ্যের সততা MCW অনলাইন গেমিং অভিজ্ঞতার মূল চালিকাশক্তি। আমাদের কাছে সর্বাধুনিক নিরাপত্তা ব্যবস্থা রয়েছে এবং সম্পূর্ণ নিরাপদ ও ন্যায্য অভিজ্ঞতা নিশ্চিত করতে আমরা নিয়মিত গেম ও প্রক্রিয়াগুলি অডিট করি। আমরা আপনার সব তথ্য গোপন রাখি এবং গোপনীয়তা নীতি অনুসারে ব্যতীত তা কখনও তৃতীয় পক্ষের সাথে শেয়ার বা বিক্রি করি না।</p>
      <p class="text-center">বিভিন্ন স্পোর্টস মার্কেট ও বিশ্বব্যাপী ক্রীড়া ইভেন্ট কভার করে আমরা সেরা মূল্য দেওয়ার চেষ্টা করি। আমাদের ক্যাসিনোতে নানা ধরনের লাইভ গেম ও স্লট গেম রয়েছে। MCW-তে আপনি বিশ্বের সর্বোচ্চ মানের অনলাইন গেমিং বিনোদন উপভোগ করবেন।</p>
      <p class="text-center">সপ্তাহে ৭ দিন, দিনে ২৪ ঘণ্টা লাইভ কাস্টমার সাপোর্টসহ আমাদের প্রশিক্ষিত ও বন্ধুত্বপূর্ণ কর্মীরা নিশ্চিত করেন যে কোনো প্রশ্ন দ্রুত, ভদ্রভাবে ও দক্ষতার সাথে সমাধান করা হয়।</p>
      <p class="text-center">আমাদের লক্ষ্য দায়িত্বশীল খেলোয়াড়দের জন্য সেরা অনলাইন গেমিং অভিজ্ঞতা প্রদান করা; আপনার মতামত বা পরামর্শ নিয়ে ফোন বা ইমেলে আমাদের সাথে যোগাযোগ করতে দ্বিধা করবেন না।</p>
      <p class="text-center">আপনার সুবিধার জন্য আমরা বিভিন্ন নিরাপদ ও সহজ পেমেন্ট পদ্ধতি অফার করি। আমরা “know your customer (KYC)” ও অ্যান্টি-মানি লন্ডারিং (AML) নীতি মেনে চলি এবং সর্বোচ্চ মানের সম্মতি নিশ্চিত করতে তৃতীয় পক্ষের আর্থিক ও নিয়ন্ত্রক কর্তৃপক্ষের সাথে সহযোগিতা করি।</p>
    `,
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    body: `
      <p>Your privacy is important to us, and we are committed to protecting your personal information. We will be clear and open about why we collect your personal information and how we use it. Where you have choices or rights, we will explain these to you.</p>
      <p>This Privacy Policy explains how Mega Casino World uses your personal information when you are using one of our websites.</p>
      <p>If you do not agree with any statements contained within this Privacy Policy, please do not proceed any further on our website. Please be aware that registering an account on our website, placing bets and transferring funds will be deemed confirmation of your full agreement with our Terms and Conditions and our Privacy Policy. You have the right to cease using the website at any time; however, we may still be legally required to retain some of your personal information.</p>
      <p>We may periodically make changes to this Privacy Policy and will notify you of these changes by posting the modified terms on our platforms. We recommend that you revisit this Privacy Policy regularly.</p>
      <h2>Who is in control of your information?</h2>
      <p>Throughout this Privacy Policy, Mega Casino World together with our subsidiaries and affiliates (collectively, “we” or “us” or “our”) control the ways your Personal Data is collected and the purposes for which your Personal Data is used by Mega Casino World, acting as the “data controller” for the purposes of applicable European data protection legislation.</p>
      <h2>Our Data Protection Officer</h2>
      <p>If you have concerns or would like any further information about how Mega Casino World handles your personal information, you can contact our Data Protection Officer at <a href="mailto:support@megacasinoworld.com">support@megacasinoworld.com</a>.</p>
      <h2>Information we collect about you</h2>
      <h3>Personally identifiable information</h3>
      <p>You provide this information to us in the process of setting up an account, placing bets and using the services of the website. This information is required to give you access to certain parts of our website and related services.</p>
      <p>This data is collected when you:<br>• Register an account with Mega Casino World;<br>• Voluntarily provide it when using the website;<br>• Personally disclose the information in public areas of the website; and<br>• Provide it when you contact our customer support team</p>
      <p>The information includes your:<br>• Username;<br>• First name and surname;<br>• Email address;<br>• Residential address;<br>• Phone number;<br>• Billing address;<br>• Identification documents;<br>• Proof of address documents;<br>• Transaction history;<br>• Website usage preferences;<br>• Any other information you provide us when using our platforms; and<br>• Credit/debit card details, or other payment information</p>
      <p>The information is also required for billing purposes and for the protection of minors. You can amend and update this information by contacting Customer Support. This data is for internal use only and is never passed to any third parties except those stated below.</p>
      <h3>Telephone Calls</h3>
      <p>Telephone calls to and from our Customer Contact Centre are recorded for training and security purposes along with the resolution of any queries arising from the service you received.</p>
      <h3>Social Features of Our Products</h3>
      <p>If you choose to participate in any of the social features that we provide with our products (such as chat rooms) Mega Casino World may store records or otherwise process this data.</p>
      <h3>Non-personally identifiable information and traffic analysis</h3>
      <p>Mega Casino World strives to make our website as user friendly as possible and easy to find on the Internet. Mega Casino World collects data on how you use the site, which does not identify you personally. When you interact with the services, our servers keep an activity log unique to you that collects certain administrative and traffic information including: source IP address, time of access, date of access, web page(s) visited, language use, software crash reports and type of browser used. This information is essential for the provision and quality of our services.</p>
      <h3>Cookies</h3>
      <p>Mega Casino World uses cookies to ensure our website works efficiently and to enhance your visits to our platforms. Further information can be found in our Cookie Policy.</p>
      <h2>How and why we use your personal information</h2>
      <p>We use your personal information in a range of ways that fall into the following categories:<br>• To provide you with the products or services you have requested;<br>• To meet our legal or regulatory obligations;<br>• To monitor our website performance; and<br>• To provide you with marketing information</p>
      <p>Your rights over your personal information differ according to which category and lawful basis this fall into. This section provides more information about each category, the rights it gives you, and how to exercise these rights. These rights are in bold following each category.</p>
      <h3>Providing our products and services</h3>
      <p>We use your personal information to enable you to use our websites, to set up your account, participate in the online sports book, casino and to provide you with customer service assistance.</p>
      <p>To provide our products and services, we share your information with external organizations working on our behalf. Further information can be found in the Sharing Information section.</p>
      <p>This category covers the essential activities required in order for us to provide you with the services you use or have signed up for. If you don’t want your information used in this way, your option is to not use our services and close your account.</p>
      <p>Mega Casino World will use your identification document and/or proof of address to check your details in order for us to protect our users from fraudulent behavior and to promote responsible gambling.</p>
      <p>We may conduct a security review at any time to validate the registration data provided by you and to verify your use of the services and your financial transactions for potential breach of our Terms and Conditions and of applicable law. Security reviews may include but are not limited to ordering a credit report and/or otherwise verifying the information you provide against third- party databases.</p>
      <h3>To monitor our website performance</h3>
      <p>As detailed above, we use cookies and traffic analysis in order to improve the performance of our website and services available. We have a legitimate interest in carrying out these activities and we ensure that we minimize any impact on your privacy.</p>
      <p>You have the ‘right to object’ to activities carried out for our legitimate interest if you believe your right to privacy outweighs our legitimate business interests. However, as the activities involved are central to our business, if you wish to object further than managing your cookies this may mean you need to close your account.</p>
      <h3>Marketing</h3>
      <p>If you have given us your consent to do so, we will send you offers and promotions via email, SMS or online. We do not share your information with third parties for them to use for their own marketing.</p>
      <p>You have the right to withdraw consent or update your marketing preferences at any time.</p>
      <h2>Your rights</h2>
      <h3>Your rights to rectification</h3>
      <p>If you believe the personal information we hold on you is incorrect, you have the right for this to be rectified. For any information that cannot be updated through My Account, please contact <a href="mailto:support@megacasinoworld.com">support@megacasinoworld.com</a>.</p>
      <h3>Your right to request a copy of your personal information</h3>
      <p>If you would like a copy of the personal information we hold about you, you should request it through live chat or by emailing <a href="mailto:support@megacasinoworld.com">support@megacasinoworld.com</a> and we will provide you with a form to complete. The form is not compulsory but helps us to provide you with the information you are looking for in a timely manner. To ensure the security of your personal information, we will ask you for valid proof of identity and once we’ve received it we will provide our response within one month. If your request is unusually complex and likely to take longer than a month, we will let you know as soon as we can and tell you how long we think it will take, such request may also incur an administration cost.</p>
      <h3>Your right of erasure</h3>
      <p>You can request us to erase your personal data where there is no compelling reason to continue processing. This right only applies in certain circumstances; it is not a guaranteed or absolute right.</p>
      <p>The right to erasure does not apply if processing is necessary for one of the following reasons: to exercise the right of freedom of expression and information; to comply with a legal obligation; for the performance of a task carried out in the public interest or in the exercise of official authority; for archiving purposes in the public interest, scientific research historical research or statistical purposes where erasure is likely to render impossible or seriously impair the achievement of that processing; or *for the establishment, exercise or defense of legal claims.</p>
      <h2>Sharing your personal information</h2>
      <p>We may disclose your Personal Data to third parties:<br>• If we are under a duty to disclose or share your personal information in order to comply with any legal or regulatory obligation;<br>• In order to enforce or apply the terms of this notice or any other agreements;<br>• To assist us in providing you with the products and services you request, including but not limited to third party software providers;<br>• If, in our sole determination, you are found to have cheated or attempted to defraud us, or other users of the service in any way including but not limited to game manipulation or payment fraud;<br>• For the purpose of research on the prevention of addiction (this data will be made anonymous)<br>• To protect the rights, property or safety of us, our customers or others; and<br>• Where we have received your permission for us to do so.</p>
      <p>Personal Information collected on the services may be stored and processed in any country in which we or our affiliates, suppliers or agents maintain facilities. By using our services, you expressly consent to any transfer of information outside of your country. When we transfer any part of your Personal Data outside the EEA or adequate jurisdictions we will take reasonable steps to ensure that it is treated as securely as it is within the EEA or adequate jurisdictions.</p>
      <p>These steps include but are not limited to the following:<br>• Binding corporate rules;<br>• Model contracts; or<br>• US/EU privacy shield</p>
      <h2>Security</h2>
      <p>We understand the importance of security and the techniques needed to secure information. We store all of the Personal Information we receive directly from you in an encrypted and password protected database residing within our secure network behind active state-of-the-art firewall software. (Our Services support SSL Version 3 with 128-bit encryption). We also take measures to ensure our subsidiaries, agents, affiliates and suppliers employ adequate security measures.</p>
      <h2>Retention</h2>
      <p>We retain personal information for as long as we reasonably require it for legal or business purposes. In determining data retention periods, Mega Casino World takes into consideration local laws, contractual obligations, and the expectations and requirements of our customers. When we no longer need your personal information, we securely delete or destroy it.</p>
      <h2>Third-Party Practices</h2>
      <p>We cannot ensure the protection of any information that you provide to a third-party online site that links to or from the services or any information collected by any third party administering our affiliate program (if applicable) or any other program, since these third-party online sites are owned and operated independently from us. Any information collected by these third parties is governed by the privacy policy, if any, of such third party. Our web site may contain links to other web sites, which are outside our control and are not covered by this Privacy Policy. If you access other sites using the links provided, the operators of these sites may collect information from you which will be used by them in accordance with their privacy policy, which may differ from ours. We are not responsible solely the operators of these websites shall be responsible for their functionality or possible errors on the linked sites.</p>
      <h2>Analytics Google</h2>
      <h3>Analytics (Google Inc.)</h3>
      <p>Google Analytics is a web analysis service provided by Google Inc. (“Google”). Google utilizes the Data collected to track and examine the use of Mega Casino World, to prepare reports on its activities and share them with other Google services. Google may use the Data collected to contextualize and personalize the ads of its own advertising network. Personal Data collected: Cookies and Usage Data.</p>
      <h2>Disclaimer</h2>
      <p>The Services operate ‘AS-IS’ and ‘AS-AVAILABLE’ without liability of any kind. We are not responsible for events beyond our direct control. Due to the complex and ever-changing nature of our technology and business, we cannot guarantee, nor do we claim that there will be error-free performance regarding the privacy of your Personal Information, and we will not be liable for any indirect, incidental, consequential or punitive damages relating to the use or release of said Personal Information.</p>
      <h2>Changes to our Privacy Statement</h2>
      <p>We may update this policy from time to time, so please review it frequently. If any material changes are made to this Privacy Policy we will use reasonable endeavors to inform you in advance by email, notice on the Website or other agreed communications channels. We will communicate the changes to you in advance, giving an appropriate amount of time for you to consider and understand the changes before they become effective. We will not enforce material changes to the Privacy Policy without your express consent. If you decline to accept the changes to the Privacy Policy, or otherwise do not accept the changes within the time period, we may not be able to continue to provide some or all products and services.</p>
    `,
    titleBn: 'গোপনীয়তা নীতি',
    bodyBn: `
      <p>আপনার গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ, এবং আমরা আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখতে প্রতিশ্রুতিবদ্ধ। কেন আমরা আপনার ব্যক্তিগত তথ্য সংগ্রহ করি এবং কীভাবে তা ব্যবহার করি সে সম্পর্কে আমরা স্পষ্ট ও উন্মুক্ত থাকব। যেখানে আপনার পছন্দ বা অধিকার রয়েছে, আমরা সেগুলো আপনাকে ব্যাখ্যা করব।</p>
      <p>এই গোপনীয়তা নীতি ব্যাখ্যা করে যে আপনি যখন আমাদের কোনো ওয়েবসাইট ব্যবহার করছেন তখন Mega Casino World কীভাবে আপনার ব্যক্তিগত তথ্য ব্যবহার করে।</p>
      <p>এই গোপনীয়তা নীতিতে থাকা কোনো বিবৃতির সাথে আপনি একমত না হলে অনুগ্রহ করে আমাদের ওয়েবসাইটে আর অগ্রসর হবেন না। অনুগ্রহ করে সচেতন থাকুন যে আমাদের ওয়েবসাইটে একটি অ্যাকাউন্ট নিবন্ধন করা, বাজি ধরা এবং তহবিল স্থানান্তর করা আমাদের শর্তাবলী ও আমাদের গোপনীয়তা নীতির সাথে আপনার সম্পূর্ণ সম্মতির নিশ্চয়তা হিসেবে গণ্য হবে। আপনার যেকোনো সময় ওয়েবসাইট ব্যবহার বন্ধ করার অধিকার রয়েছে; তবে, আইনগতভাবে আমরা আপনার কিছু ব্যক্তিগত তথ্য ধরে রাখতে বাধ্য থাকতে পারি।</p>
      <p>আমরা সময়ে সময়ে এই গোপনীয়তা নীতিতে পরিবর্তন আনতে পারি এবং আমাদের প্ল্যাটফর্মে পরিবর্তিত শর্তাবলী পোস্ট করার মাধ্যমে এই পরিবর্তনগুলো সম্পর্কে আপনাকে অবহিত করব। আমরা সুপারিশ করি যে আপনি নিয়মিতভাবে এই গোপনীয়তা নীতিটি পুনরায় দেখে নিন।</p>
      <h2>আপনার তথ্য কে নিয়ন্ত্রণ করে?</h2>
      <p>এই গোপনীয়তা নীতি জুড়ে, Mega Casino World তার সহযোগী প্রতিষ্ঠান ও অধিভুক্ত সংস্থাসমূহের সাথে (সম্মিলিতভাবে, “আমরা” বা “আমাদের”) আপনার ব্যক্তিগত তথ্য সংগ্রহের পদ্ধতি এবং যে উদ্দেশ্যে Mega Casino World আপনার ব্যক্তিগত তথ্য ব্যবহার করে তা নিয়ন্ত্রণ করে, প্রযোজ্য ইউরোপীয় ডেটা সুরক্ষা আইনের উদ্দেশ্যে “ডেটা কন্ট্রোলার” হিসেবে কাজ করে।</p>
      <h2>আমাদের ডেটা সুরক্ষা কর্মকর্তা</h2>
      <p>Mega Casino World কীভাবে আপনার ব্যক্তিগত তথ্য পরিচালনা করে সে সম্পর্কে আপনার কোনো উদ্বেগ থাকলে বা আরও তথ্য চাইলে, আপনি আমাদের ডেটা সুরক্ষা কর্মকর্তার সাথে <a href="mailto:support@megacasinoworld.com">support@megacasinoworld.com</a> এ যোগাযোগ করতে পারেন।</p>
      <h2>আপনার সম্পর্কে আমরা যে তথ্য সংগ্রহ করি</h2>
      <h3>ব্যক্তিগতভাবে শনাক্তযোগ্য তথ্য</h3>
      <p>একটি অ্যাকাউন্ট তৈরি করা, বাজি ধরা এবং ওয়েবসাইটের সেবা ব্যবহারের প্রক্রিয়ায় আপনি এই তথ্য আমাদের প্রদান করেন। আমাদের ওয়েবসাইটের নির্দিষ্ট কিছু অংশ এবং সংশ্লিষ্ট সেবায় আপনাকে প্রবেশাধিকার দেওয়ার জন্য এই তথ্য প্রয়োজন।</p>
      <p>এই ডেটা তখন সংগ্রহ করা হয় যখন আপনি:<br>• Mega Casino World এ একটি অ্যাকাউন্ট নিবন্ধন করেন;<br>• ওয়েবসাইট ব্যবহার করার সময় স্বেচ্ছায় তা প্রদান করেন;<br>• ওয়েবসাইটের সর্বজনীন অংশে ব্যক্তিগতভাবে তথ্য প্রকাশ করেন; এবং<br>• আমাদের গ্রাহক সহায়তা দলের সাথে যোগাযোগ করার সময় তা প্রদান করেন</p>
      <p>এই তথ্যের মধ্যে রয়েছে আপনার:<br>• ব্যবহারকারীর নাম;<br>• নাম ও পদবি;<br>• ইমেইল ঠিকানা;<br>• আবাসিক ঠিকানা;<br>• ফোন নম্বর;<br>• বিলিং ঠিকানা;<br>• শনাক্তকরণ নথিপত্র;<br>• ঠিকানার প্রমাণপত্র;<br>• লেনদেনের ইতিহাস;<br>• ওয়েবসাইট ব্যবহারের পছন্দসমূহ;<br>• আমাদের প্ল্যাটফর্ম ব্যবহারের সময় আপনি আমাদের প্রদান করেন এমন অন্য যেকোনো তথ্য; এবং<br>• ক্রেডিট/ডেবিট কার্ডের বিবরণ, বা অন্যান্য পেমেন্ট তথ্য</p>
      <p>এই তথ্য বিলিং উদ্দেশ্যে এবং নাবালকদের সুরক্ষার জন্যও প্রয়োজন। আপনি গ্রাহক সহায়তার সাথে যোগাযোগ করে এই তথ্য সংশোধন ও হালনাগাদ করতে পারেন। এই ডেটা কেবলমাত্র অভ্যন্তরীণ ব্যবহারের জন্য এবং নিচে উল্লিখিত ক্ষেত্র ছাড়া কখনোই কোনো তৃতীয় পক্ষের কাছে হস্তান্তর করা হয় না।</p>
      <h3>টেলিফোন কল</h3>
      <p>আমাদের গ্রাহক যোগাযোগ কেন্দ্রে করা ও সেখান থেকে করা টেলিফোন কলগুলো প্রশিক্ষণ ও নিরাপত্তার উদ্দেশ্যে এবং আপনার প্রাপ্ত সেবা থেকে উদ্ভূত যেকোনো জিজ্ঞাসা সমাধানের জন্য রেকর্ড করা হয়।</p>
      <h3>আমাদের পণ্যের সামাজিক বৈশিষ্ট্যসমূহ</h3>
      <p>আমরা আমাদের পণ্যের সাথে যে সামাজিক বৈশিষ্ট্যগুলো প্রদান করি (যেমন চ্যাট রুম) সেগুলোর কোনোটিতে আপনি অংশগ্রহণ করতে বেছে নিলে Mega Casino World এই ডেটার রেকর্ড সংরক্ষণ করতে পারে বা অন্যভাবে প্রক্রিয়া করতে পারে।</p>
      <h3>ব্যক্তিগতভাবে অশনাক্তযোগ্য তথ্য এবং ট্রাফিক বিশ্লেষণ</h3>
      <p>Mega Casino World আমাদের ওয়েবসাইটকে যতটা সম্ভব ব্যবহারকারী-বান্ধব এবং ইন্টারনেটে সহজে খুঁজে পাওয়ার উপযোগী করার চেষ্টা করে। Mega Casino World আপনি কীভাবে সাইটটি ব্যবহার করেন সে সম্পর্কে ডেটা সংগ্রহ করে, যা আপনাকে ব্যক্তিগতভাবে শনাক্ত করে না। আপনি যখন সেবাগুলোর সাথে ইন্টারঅ্যাক্ট করেন, তখন আমাদের সার্ভার আপনার জন্য একটি অনন্য কার্যকলাপের লগ রাখে যা কিছু প্রশাসনিক ও ট্রাফিক তথ্য সংগ্রহ করে, যার মধ্যে রয়েছে: সোর্স IP ঠিকানা, প্রবেশের সময়, প্রবেশের তারিখ, পরিদর্শিত ওয়েব পেজ(সমূহ), ভাষার ব্যবহার, সফটওয়্যার ক্র্যাশ রিপোর্ট এবং ব্যবহৃত ব্রাউজারের ধরন। আমাদের সেবার সরবরাহ ও মানের জন্য এই তথ্য অপরিহার্য।</p>
      <h3>কুকিজ</h3>
      <p>Mega Casino World আমাদের ওয়েবসাইট যাতে দক্ষতার সাথে কাজ করে এবং আমাদের প্ল্যাটফর্মে আপনার পরিদর্শন উন্নত করার জন্য কুকিজ ব্যবহার করে। আরও তথ্য আমাদের কুকি নীতিতে পাওয়া যাবে।</p>
      <h2>আমরা কীভাবে এবং কেন আপনার ব্যক্তিগত তথ্য ব্যবহার করি</h2>
      <p>আমরা আপনার ব্যক্তিগত তথ্য বিভিন্ন উপায়ে ব্যবহার করি যা নিম্নলিখিত শ্রেণিতে পড়ে:<br>• আপনার অনুরোধকৃত পণ্য বা সেবা আপনাকে সরবরাহ করার জন্য;<br>• আমাদের আইনি বা নিয়ন্ত্রক বাধ্যবাধকতা পূরণ করার জন্য;<br>• আমাদের ওয়েবসাইটের কর্মক্ষমতা পর্যবেক্ষণ করার জন্য; এবং<br>• আপনাকে বিপণন তথ্য প্রদান করার জন্য</p>
      <p>আপনার ব্যক্তিগত তথ্যের উপর আপনার অধিকার এটি কোন শ্রেণি ও আইনি ভিত্তিতে পড়ে তার উপর নির্ভর করে ভিন্ন হয়। এই বিভাগটি প্রতিটি শ্রেণি, এটি আপনাকে যে অধিকার দেয় এবং কীভাবে এই অধিকারগুলো প্রয়োগ করতে হয় সে সম্পর্কে আরও তথ্য প্রদান করে। প্রতিটি শ্রেণির পরে এই অধিকারগুলো গাঢ় অক্ষরে দেওয়া আছে।</p>
      <h3>আমাদের পণ্য ও সেবা সরবরাহ করা</h3>
      <p>আপনাকে আমাদের ওয়েবসাইট ব্যবহার করতে, আপনার অ্যাকাউন্ট সেট আপ করতে, অনলাইন স্পোর্টস বুক ও ক্যাসিনোতে অংশগ্রহণ করতে এবং আপনাকে গ্রাহক সেবা সহায়তা প্রদান করতে আমরা আপনার ব্যক্তিগত তথ্য ব্যবহার করি।</p>
      <p>আমাদের পণ্য ও সেবা সরবরাহ করার জন্য, আমরা আমাদের পক্ষে কাজ করা বাহ্যিক সংস্থার সাথে আপনার তথ্য শেয়ার করি। আরও তথ্য তথ্য শেয়ারিং বিভাগে পাওয়া যাবে।</p>
      <p>এই শ্রেণিটি আপনার ব্যবহৃত বা সাইন আপকৃত সেবাগুলো আপনাকে সরবরাহ করার জন্য প্রয়োজনীয় অপরিহার্য কার্যক্রমগুলো অন্তর্ভুক্ত করে। আপনি যদি আপনার তথ্য এইভাবে ব্যবহৃত হতে না চান, তাহলে আপনার বিকল্প হলো আমাদের সেবা ব্যবহার না করা এবং আপনার অ্যাকাউন্ট বন্ধ করা।</p>
      <p>Mega Casino World আপনার বিবরণ যাচাই করার জন্য আপনার শনাক্তকরণ নথি এবং/অথবা ঠিকানার প্রমাণ ব্যবহার করবে যাতে আমরা আমাদের ব্যবহারকারীদের প্রতারণামূলক আচরণ থেকে রক্ষা করতে এবং দায়িত্বশীল জুয়াকে উৎসাহিত করতে পারি।</p>
      <p>আমাদের শর্তাবলী ও প্রযোজ্য আইনের সম্ভাব্য লঙ্ঘনের জন্য আপনার প্রদত্ত নিবন্ধন ডেটা যাচাই করতে এবং সেবার ব্যবহার ও আপনার আর্থিক লেনদেন যাচাই করতে আমরা যেকোনো সময় একটি নিরাপত্তা পর্যালোচনা পরিচালনা করতে পারি। নিরাপত্তা পর্যালোচনার অন্তর্ভুক্ত হতে পারে কিন্তু সীমাবদ্ধ নয় এমন বিষয়, যেমন একটি ক্রেডিট রিপোর্ট অর্ডার করা এবং/অথবা তৃতীয় পক্ষের ডেটাবেসের সাথে আপনার প্রদত্ত তথ্য অন্যভাবে যাচাই করা।</p>
      <h3>আমাদের ওয়েবসাইটের কর্মক্ষমতা পর্যবেক্ষণ করা</h3>
      <p>উপরে বিস্তারিত বর্ণিত হিসেবে, আমরা আমাদের ওয়েবসাইট ও উপলব্ধ সেবার কর্মক্ষমতা উন্নত করতে কুকিজ ও ট্রাফিক বিশ্লেষণ ব্যবহার করি। এই কার্যক্রমগুলো পরিচালনায় আমাদের বৈধ স্বার্থ রয়েছে এবং আমরা নিশ্চিত করি যে আপনার গোপনীয়তার উপর যেকোনো প্রভাব আমরা ন্যূনতম রাখি।</p>
      <p>আপনি যদি বিশ্বাস করেন যে আপনার গোপনীয়তার অধিকার আমাদের বৈধ ব্যবসায়িক স্বার্থের চেয়ে বেশি গুরুত্বপূর্ণ, তাহলে আমাদের বৈধ স্বার্থে পরিচালিত কার্যক্রমে ‘আপত্তি জানানোর অধিকার’ আপনার রয়েছে। তবে, যেহেতু এই কার্যক্রমগুলো আমাদের ব্যবসার কেন্দ্রবিন্দু, তাই আপনি যদি আপনার কুকি পরিচালনার বাইরেও আপত্তি জানাতে চান তাহলে এর অর্থ হতে পারে আপনাকে আপনার অ্যাকাউন্ট বন্ধ করতে হবে।</p>
      <h3>বিপণন</h3>
      <p>আপনি যদি আমাদের সম্মতি দিয়ে থাকেন, তাহলে আমরা আপনাকে ইমেইল, SMS বা অনলাইনের মাধ্যমে অফার ও প্রচার পাঠাব। আমরা তৃতীয় পক্ষের নিজস্ব বিপণনের জন্য তাদের সাথে আপনার তথ্য শেয়ার করি না।</p>
      <p>আপনার যেকোনো সময় সম্মতি প্রত্যাহার করার বা আপনার বিপণন পছন্দসমূহ হালনাগাদ করার অধিকার রয়েছে।</p>
      <h2>আপনার অধিকারসমূহ</h2>
      <h3>সংশোধনের অধিকার</h3>
      <p>আপনি যদি বিশ্বাস করেন যে আমরা আপনার সম্পর্কে যে ব্যক্তিগত তথ্য রাখি তা ভুল, তাহলে এটি সংশোধন করার অধিকার আপনার রয়েছে। My Account এর মাধ্যমে হালনাগাদ করা যায় না এমন যেকোনো তথ্যের জন্য, অনুগ্রহ করে <a href="mailto:support@megacasinoworld.com">support@megacasinoworld.com</a> এ যোগাযোগ করুন।</p>
      <h3>আপনার ব্যক্তিগত তথ্যের একটি অনুলিপি অনুরোধ করার অধিকার</h3>
      <p>আমরা আপনার সম্পর্কে যে ব্যক্তিগত তথ্য রাখি তার একটি অনুলিপি আপনি চাইলে, লাইভ চ্যাটের মাধ্যমে বা <a href="mailto:support@megacasinoworld.com">support@megacasinoworld.com</a> এ ইমেইল করে তা অনুরোধ করা উচিত এবং আমরা আপনাকে পূরণের জন্য একটি ফর্ম প্রদান করব। ফর্মটি বাধ্যতামূলক নয় তবে আপনি যে তথ্য খুঁজছেন তা সময়মতো প্রদানে আমাদের সাহায্য করে। আপনার ব্যক্তিগত তথ্যের নিরাপত্তা নিশ্চিত করতে, আমরা আপনার কাছে বৈধ পরিচয় প্রমাণ চাইব এবং তা পাওয়ার পর আমরা এক মাসের মধ্যে আমাদের উত্তর প্রদান করব। আপনার অনুরোধ অস্বাভাবিকভাবে জটিল হলে এবং এক মাসের বেশি সময় নেওয়ার সম্ভাবনা থাকলে, আমরা যত দ্রুত সম্ভব আপনাকে জানাব এবং কত সময় লাগবে বলে আমরা মনে করি তা জানাব, এমন অনুরোধে একটি প্রশাসনিক খরচও যুক্ত হতে পারে।</p>
      <h3>মুছে ফেলার অধিকার</h3>
      <p>প্রক্রিয়াকরণ চালিয়ে যাওয়ার কোনো বাধ্যতামূলক কারণ না থাকলে আপনি আমাদের কাছে আপনার ব্যক্তিগত ডেটা মুছে ফেলার অনুরোধ করতে পারেন। এই অধিকারটি কেবল নির্দিষ্ট কিছু পরিস্থিতিতে প্রযোজ্য; এটি একটি নিশ্চিত বা পরম অধিকার নয়।</p>
      <p>নিম্নলিখিত কারণগুলোর কোনো একটির জন্য প্রক্রিয়াকরণ প্রয়োজনীয় হলে মুছে ফেলার অধিকার প্রযোজ্য নয়: মত প্রকাশ ও তথ্যের স্বাধীনতার অধিকার প্রয়োগ করতে; কোনো আইনি বাধ্যবাধকতা পালন করতে; জনস্বার্থে পরিচালিত কোনো কাজ সম্পাদনে বা সরকারি কর্তৃত্ব প্রয়োগে; জনস্বার্থে সংরক্ষণাগার উদ্দেশ্যে, বৈজ্ঞানিক গবেষণা, ঐতিহাসিক গবেষণা বা পরিসংখ্যানগত উদ্দেশ্যে যেখানে মুছে ফেলা সেই প্রক্রিয়াকরণের অর্জনকে অসম্ভব বা গুরুতরভাবে ব্যাহত করতে পারে; অথবা *আইনি দাবি প্রতিষ্ঠা, প্রয়োগ বা প্রতিরক্ষার জন্য।</p>
      <h2>আপনার ব্যক্তিগত তথ্য শেয়ার করা</h2>
      <p>আমরা তৃতীয় পক্ষের কাছে আপনার ব্যক্তিগত ডেটা প্রকাশ করতে পারি:<br>• যদি আমরা কোনো আইনি বা নিয়ন্ত্রক বাধ্যবাধকতা মেনে চলার জন্য আপনার ব্যক্তিগত তথ্য প্রকাশ বা শেয়ার করতে বাধ্য থাকি;<br>• এই বিজ্ঞপ্তি বা অন্য কোনো চুক্তির শর্তাবলী কার্যকর বা প্রয়োগ করার জন্য;<br>• আপনার অনুরোধকৃত পণ্য ও সেবা আপনাকে সরবরাহে আমাদের সহায়তা করতে, যার মধ্যে অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয় তৃতীয় পক্ষের সফটওয়্যার সরবরাহকারীরা;<br>• যদি, আমাদের একক সিদ্ধান্তে, আপনি প্রতারণা করেছেন বা আমাদের বা সেবার অন্য ব্যবহারকারীদের যেকোনো উপায়ে প্রতারণার চেষ্টা করেছেন বলে প্রমাণিত হন, যার মধ্যে অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয় গেম কারসাজি বা পেমেন্ট জালিয়াতি;<br>• আসক্তি প্রতিরোধ বিষয়ক গবেষণার উদ্দেশ্যে (এই ডেটা বেনামী করা হবে);<br>• আমাদের, আমাদের গ্রাহক বা অন্যদের অধিকার, সম্পত্তি বা নিরাপত্তা রক্ষার জন্য; এবং<br>• যেখানে আমরা তা করার জন্য আপনার অনুমতি পেয়েছি।</p>
      <p>সেবাগুলোতে সংগৃহীত ব্যক্তিগত তথ্য যেকোনো দেশে সংরক্ষণ ও প্রক্রিয়া করা হতে পারে যেখানে আমরা বা আমাদের অধিভুক্ত সংস্থা, সরবরাহকারী বা এজেন্টরা সুবিধা বজায় রাখে। আমাদের সেবা ব্যবহার করে, আপনি আপনার দেশের বাইরে যেকোনো তথ্য স্থানান্তরে স্পষ্টভাবে সম্মতি দেন। আমরা যখন আপনার ব্যক্তিগত ডেটার কোনো অংশ EEA বা পর্যাপ্ত এখতিয়ারের বাইরে স্থানান্তর করি তখন আমরা যুক্তিসঙ্গত পদক্ষেপ নেব যাতে এটি EEA বা পর্যাপ্ত এখতিয়ারের মধ্যে যতটা নিরাপদভাবে রাখা হয় ততটাই নিরাপদভাবে পরিচালিত হয়।</p>
      <p>এই পদক্ষেপগুলোর মধ্যে অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয় নিম্নলিখিত বিষয়:<br>• বাইন্ডিং কর্পোরেট নিয়মাবলী;<br>• মডেল চুক্তি; অথবা<br>• US/EU প্রাইভেসি শিল্ড</p>
      <h2>নিরাপত্তা</h2>
      <p>আমরা নিরাপত্তার গুরুত্ব এবং তথ্য সুরক্ষিত রাখতে প্রয়োজনীয় কৌশলগুলো বুঝি। আমরা আপনার কাছ থেকে সরাসরি প্রাপ্ত সমস্ত ব্যক্তিগত তথ্য একটি এনক্রিপ্টেড ও পাসওয়ার্ড-সুরক্ষিত ডেটাবেসে সংরক্ষণ করি যা আমাদের নিরাপদ নেটওয়ার্কের মধ্যে সক্রিয় অত্যাধুনিক ফায়ারওয়াল সফটওয়্যারের আড়ালে থাকে। (আমাদের সেবা 128-বিট এনক্রিপশনসহ SSL সংস্করণ 3 সমর্থন করে)। আমরা আমাদের সহযোগী প্রতিষ্ঠান, এজেন্ট, অধিভুক্ত সংস্থা ও সরবরাহকারীরা যাতে পর্যাপ্ত নিরাপত্তা ব্যবস্থা গ্রহণ করে তা নিশ্চিত করার পদক্ষেপও নিই।</p>
      <h2>সংরক্ষণ</h2>
      <p>আমরা আইনি বা ব্যবসায়িক উদ্দেশ্যে যতক্ষণ যুক্তিসঙ্গতভাবে প্রয়োজন ততক্ষণ ব্যক্তিগত তথ্য ধরে রাখি। ডেটা সংরক্ষণের সময়কাল নির্ধারণে, Mega Casino World স্থানীয় আইন, চুক্তিগত বাধ্যবাধকতা এবং আমাদের গ্রাহকদের প্রত্যাশা ও প্রয়োজনীয়তা বিবেচনা করে। আমাদের যখন আর আপনার ব্যক্তিগত তথ্যের প্রয়োজন হয় না, তখন আমরা তা নিরাপদভাবে মুছে ফেলি বা ধ্বংস করি।</p>
      <h2>তৃতীয় পক্ষের চর্চা</h2>
      <p>সেবার সাথে লিঙ্ক করা বা সেবা থেকে লিঙ্ক করা কোনো তৃতীয় পক্ষের অনলাইন সাইটে আপনি যে তথ্য প্রদান করেন বা আমাদের অ্যাফিলিয়েট প্রোগ্রাম (যদি প্রযোজ্য হয়) বা অন্য কোনো প্রোগ্রাম পরিচালনাকারী কোনো তৃতীয় পক্ষ কর্তৃক সংগৃহীত কোনো তথ্যের সুরক্ষা আমরা নিশ্চিত করতে পারি না, কারণ এই তৃতীয় পক্ষের অনলাইন সাইটগুলো আমাদের থেকে স্বাধীনভাবে মালিকানাধীন ও পরিচালিত। এই তৃতীয় পক্ষগুলো কর্তৃক সংগৃহীত যেকোনো তথ্য সেই তৃতীয় পক্ষের গোপনীয়তা নীতি দ্বারা নিয়ন্ত্রিত হয়, যদি থাকে। আমাদের ওয়েবসাইটে অন্যান্য ওয়েবসাইটের লিঙ্ক থাকতে পারে, যা আমাদের নিয়ন্ত্রণের বাইরে এবং এই গোপনীয়তা নীতির আওতাভুক্ত নয়। আপনি যদি প্রদত্ত লিঙ্ক ব্যবহার করে অন্য সাইটে প্রবেশ করেন, তাহলে এই সাইটগুলোর পরিচালকরা আপনার কাছ থেকে তথ্য সংগ্রহ করতে পারে যা তারা তাদের গোপনীয়তা নীতি অনুযায়ী ব্যবহার করবে, যা আমাদের থেকে ভিন্ন হতে পারে। আমরা দায়ী নই, কেবল এই ওয়েবসাইটগুলোর পরিচালকরাই তাদের কার্যকারিতা বা লিঙ্কড সাইটে সম্ভাব্য ত্রুটির জন্য দায়ী থাকবেন।</p>
      <h2>Analytics Google</h2>
      <h3>Analytics (Google Inc.)</h3>
      <p>Google Analytics হলো Google Inc. (“Google”) দ্বারা প্রদত্ত একটি ওয়েব বিশ্লেষণ সেবা। Google সংগৃহীত ডেটা ব্যবহার করে Mega Casino World এর ব্যবহার ট্র্যাক ও পরীক্ষা করতে, এর কার্যক্রম সম্পর্কে রিপোর্ট প্রস্তুত করতে এবং সেগুলো অন্যান্য Google সেবার সাথে শেয়ার করতে। Google সংগৃহীত ডেটা ব্যবহার করে তার নিজস্ব বিজ্ঞাপন নেটওয়ার্কের বিজ্ঞাপনগুলোকে প্রাসঙ্গিক ও ব্যক্তিগতকৃত করতে পারে। সংগৃহীত ব্যক্তিগত ডেটা: কুকিজ ও ব্যবহারের ডেটা।</p>
      <h2>দাবিত্যাগ</h2>
      <p>সেবাগুলো কোনো ধরনের দায় ছাড়াই ‘যেমন আছে (AS-IS)’ ও ‘যেমন উপলব্ধ (AS-AVAILABLE)’ ভিত্তিতে পরিচালিত হয়। আমাদের সরাসরি নিয়ন্ত্রণের বাইরের ঘটনার জন্য আমরা দায়ী নই। আমাদের প্রযুক্তি ও ব্যবসার জটিল ও প্রতিনিয়ত পরিবর্তনশীল প্রকৃতির কারণে, আপনার ব্যক্তিগত তথ্যের গোপনীয়তার ক্ষেত্রে ত্রুটিমুক্ত কর্মক্ষমতা থাকবে বলে আমরা নিশ্চয়তা দিতে পারি না, দাবিও করি না, এবং উক্ত ব্যক্তিগত তথ্যের ব্যবহার বা প্রকাশ সম্পর্কিত কোনো পরোক্ষ, আনুষঙ্গিক, ফলস্বরূপ বা শাস্তিমূলক ক্ষতির জন্য আমরা দায়ী থাকব না।</p>
      <h2>আমাদের গোপনীয়তা বিবৃতিতে পরিবর্তন</h2>
      <p>আমরা সময়ে সময়ে এই নীতি হালনাগাদ করতে পারি, তাই অনুগ্রহ করে এটি ঘন ঘন পর্যালোচনা করুন। এই গোপনীয়তা নীতিতে কোনো গুরুত্বপূর্ণ পরিবর্তন করা হলে আমরা ইমেইল, ওয়েবসাইটে নোটিশ বা অন্যান্য সম্মত যোগাযোগ চ্যানেলের মাধ্যমে আগে থেকে আপনাকে জানানোর যুক্তিসঙ্গত প্রচেষ্টা করব। পরিবর্তনগুলো কার্যকর হওয়ার আগে সেগুলো বিবেচনা ও বোঝার জন্য আপনাকে যথাযথ সময় দিয়ে আমরা আগে থেকেই পরিবর্তনগুলো আপনাকে জানাব। আপনার স্পষ্ট সম্মতি ছাড়া আমরা গোপনীয়তা নীতিতে গুরুত্বপূর্ণ পরিবর্তন কার্যকর করব না। আপনি যদি গোপনীয়তা নীতির পরিবর্তন গ্রহণ করতে অস্বীকার করেন, বা নির্দিষ্ট সময়সীমার মধ্যে পরিবর্তনগুলো গ্রহণ না করেন, তাহলে আমরা কিছু বা সমস্ত পণ্য ও সেবা সরবরাহ চালিয়ে যেতে সক্ষম নাও হতে পারি।</p>
    `,
  },
  'security': {
    title: 'Mega Casino World (MCW) Security',
    body: `
      <p>We maintain the utmost available means to ensure that your information remains safe with us. All information is transferred using encryption technologies and once stored on our servers, it is maintained safe using the latest Firewall technologies available today. Both our web site and software use all available means to maintain data accuracy and privacy and to protect your data from being misused and/or lost.</p>
      <p>If you have any other questions or concerns regarding data privacy and security please do not hesitate to contact our Customer Support at any time, 24 hours a day, and 7 days a week. Our Customer Support representatives will be more than happy to assist you.</p>
      <h4>Cookies Policy</h4>
      <p>MCW aims to give you the best service and user experience at all times. One of our ways to deliver this is by the use of Cookies.</p>
      <h4>What is a “Cookie”?</h4>
      <p>A Cookie, also known as browser or tracking cookie sends a small piece of information sent by a web server to a web browser which enables the server to collect information from the browser. When you load a particular website, cookies are created and every time the user goes back to the same website, the browser retrieves and sends collected information to the website’s server.</p>
      <p>Cookies are used to help users navigate their websites efficiently and perform certain functions. Due to their core role of enhancing/enabling usability or site processes, disabling cookies may prevent users from using certain function of websites.</p>
      <h4>How MCW use Cookies</h4>
      <p>Generally, MCW use cookies to improve user experience. To give you a better view and understanding, we provided below how cookies are used on our websites.</p>
      <h4>Tracking and Analysis</h4>
      <p>Cookies are used to analyze website traffic to further improve our website services.</p>
      <p>Used to gather information which will be used for the MCW affiliate program.</p>
      <p>Analyze how users move inside the website and collect information about how visitors use our site. MCW use this information to compile reports and help us improve our service.</p>
      <h4>Functionality</h4>
      <p>This will allow us to recognize you as a returning visitor and display your preferred content.</p>
      <p>Used to speed up and enhance your experience of our services offered.</p>
      <p>Cookies are used for online chat services to provide support to our visitors.</p>
      <p>MCW particularly uses session and persistent type of cookies. Session cookies which expires upon session logout and persistent which can be stored in your browser for a minute up to years depending on specific type of cookies.</p>
      <h4>How to manage cookies</h4>
      <p>You can always configure your browser if you wish to disable, delete stop storing cookies on your computer by deleting or altering your browser’s privacy setting. However please do note that disabling cookies may affect some services or features we offer.</p>
      <h4>MCW Official</h4>
      <p>Please be wary of unlicensed and unregulated entities attempting to replicate MCW websites with malicious intentions. These fake websites are not associated with MCW in any way and are beyond our control and protection. For the highest security standards, only play at Official MCW websites. For more information, visit <a href="https://mcwlink.co/mcwguidebd">https://mcwlink.co/mcwguidebd</a>.</p>
    `,
    titleBn: 'মেগা ক্যাসিনো ওয়ার্ল্ড (MCW) নিরাপত্তা',
    bodyBn: `
      <p>আপনার তথ্য আমাদের কাছে নিরাপদ রাখতে আমরা সর্বোচ্চ ব্যবস্থা গ্রহণ করি। সমস্ত তথ্য এনক্রিপশন প্রযুক্তির মাধ্যমে স্থানান্তরিত হয় এবং সার্ভারে সংরক্ষণের পর সর্বাধুনিক ফায়ারওয়াল প্রযুক্তি দিয়ে সুরক্ষিত রাখা হয়। আমাদের ওয়েবসাইট ও সফটওয়্যার ডেটার নির্ভুলতা ও গোপনীয়তা বজায় রাখতে এবং অপব্যবহার বা হারানো থেকে রক্ষা করতে সব ব্যবস্থা ব্যবহার করে।</p>
      <p>ডেটা গোপনীয়তা ও নিরাপত্তা নিয়ে কোনো প্রশ্ন থাকলে দিনে ২৪ ঘণ্টা, সপ্তাহে ৭ দিন আমাদের কাস্টমার সাপোর্টে যোগাযোগ করতে দ্বিধা করবেন না।</p>
      <h4>কুকিজ নীতি</h4>
      <p>MCW সবসময় সেরা সেবা ও অভিজ্ঞতা দিতে চায়। এর একটি উপায় হলো কুকিজের ব্যবহার।</p>
      <h4>“কুকি” কী?</h4>
      <p>কুকি হলো একটি ছোট তথ্য যা ওয়েব সার্ভার আপনার ব্রাউজারে পাঠায়, যা সার্ভারকে তথ্য সংগ্রহে সহায়তা করে। প্রতিবার একই সাইটে ফিরে গেলে ব্রাউজার সংগৃহীত তথ্য সাইটের সার্ভারে পাঠায়।</p>
      <h4>MCW কীভাবে কুকি ব্যবহার করে</h4>
      <p>সাধারণভাবে, ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে আমরা কুকি ব্যবহার করি — যেমন ওয়েবসাইট ট্রাফিক বিশ্লেষণ, কার্যকারিতা উন্নয়ন এবং লাইভ চ্যাট সাপোর্ট।</p>
      <h4>কীভাবে কুকি পরিচালনা করবেন</h4>
      <p>আপনি চাইলে ব্রাউজারের প্রাইভেসি সেটিং পরিবর্তন করে কুকি নিষ্ক্রিয়, মুছে বা বন্ধ করতে পারেন। তবে কুকি নিষ্ক্রিয় করলে কিছু সেবা বা ফিচার প্রভাবিত হতে পারে।</p>
      <h4>MCW অফিসিয়াল</h4>
      <p>ক্ষতিকর উদ্দেশ্যে MCW ওয়েবসাইট নকল করার চেষ্টা করা অননুমোদিত সাইট থেকে সতর্ক থাকুন। এই ভুয়া সাইটগুলো MCW-এর সাথে সম্পর্কিত নয়। সর্বোচ্চ নিরাপত্তার জন্য শুধুমাত্র অফিসিয়াল MCW সাইটে খেলুন। আরও তথ্যের জন্য দেখুন <a href="https://mcwlink.co/mcwguidebd">https://mcwlink.co/mcwguidebd</a>।</p>
    `,
  },
  'responsible-gaming': {
    title: 'Responsible Gaming',
    body: `
      <p>Mega Casino World is here to provide an excellent and enjoyable gaming experience and recognize our responsibility in preventing problematic activity. We advise all players to take into account the following, and not game irresponsibly:</p>
      <ul>
      <li>Play for entertainment, not to make money.</li>
      <li>Avoid chasing losses.</li>
      <li>Establish limits for yourself.</li>
      <li>Do not let gambling interfere with your daily responsibilities.</li>
      <li>Never gamble unless you can cover losses.</li>
      <li>Take breaks.</li>
      </ul>
      <p>See the below questions. If your answer to the majority of them is &ldquo;YES&rdquo;, we advise you take action to prevent gambling from negatively impacting your life:</p>
      <ul>
      <li>Does gambling affect your work?</li>
      <li>Has gambling caused arguments with family/friends?</li>
      <li>Do you always return to win back your losses?</li>
      <li>Have you borrowed money to gamble?</li>
      <li>Do you see gambling as a source of income?</li>
      <li>Do you find it difficult to limit your gambling?</li>
      </ul>
      <h2>What to do?</h2>
      <p>Listed below are reputed organizations committed to helping those who struggle with gambling problems, and can be contacted at any time:</p>
      <ul>
      <li>Gamblers Anonymous</li>
      <li>Gambling Therapy</li>
      <li>GamCare</li>
      </ul>
      <h2>How we can help?</h2>
      <p>We advise all players who are concerned about their gambling behavior to take a break by excluding themselves from their gaming account. Self-exclusion will lock your account for a minimum of 6 months and no promotional material will be sent.</p>
      <p>Contact our experienced Customer Support team at any time to request this and they will kindly assist you. A 7 day cooling off period is also available. We recommend that you contact all other gambling sites where you have an account and request self-exclusion there also.</p>
      <h2>Underage gambling</h2>
      <p>Players must be of legal gambling age in their jurisdiction (at least 18+) in order to play at Site Name. It is their responsibility to be aware of the age restriction where they reside and play, and to confirm their legitimacy when creating an account at Site Name. We also advise parents to do the following:</p>
      <ul>
      <li>Password protect computer, mobile, and/or tablet.</li>
      <li>Do not leave device unattended when logged into your account.</li>
      <li>Make sure all account details and credit cards are inaccessible to children.</li>
      <li>Do not save passwords on your computer, write them down and keep somewhere out of reach.</li>
      <li>Download filtering software (e.g. Net Nanny) to prevent minors from accessing inappropriate sites.</li>
      </ul>
    `,
    titleBn: 'দায়িত্বশীল গেমিং',
    bodyBn: `
      <p>মেগা ক্যাসিনো ওয়ার্ল্ড একটি চমৎকার ও উপভোগ্য গেমিং অভিজ্ঞতা দিতে চায় এবং সমস্যাযুক্ত আচরণ প্রতিরোধে দায়বদ্ধ। আমরা সকল খেলোয়াড়কে নিচের বিষয়গুলো বিবেচনায় নিতে এবং দায়িত্বজ্ঞানহীনভাবে না খেলতে পরামর্শ দিই:</p>
      <ul>
      <li>টাকা আয়ের জন্য নয়, বিনোদনের জন্য খেলুন।</li>
      <li>ক্ষতি পুষিয়ে নিতে ধারাবাহিকভাবে খেলা এড়িয়ে চলুন।</li>
      <li>নিজের জন্য সীমা নির্ধারণ করুন।</li>
      <li>গেমিং যেন আপনার দৈনন্দিন দায়িত্বে বাধা না দেয়।</li>
      <li>ক্ষতি বহন করতে না পারলে কখনো বাজি ধরবেন না।</li>
      <li>মাঝে মাঝে বিরতি নিন।</li>
      </ul>
      <p>নিচের প্রশ্নগুলো দেখুন। বেশিরভাগের উত্তর যদি “হ্যাঁ” হয়, তবে গেমিং যেন আপনার জীবনে নেতিবাচক প্রভাব না ফেলে সে জন্য পদক্ষেপ নিন:</p>
      <ul>
      <li>গেমিং কি আপনার কাজে প্রভাব ফেলে?</li>
      <li>গেমিং কি পরিবার/বন্ধুদের সাথে ঝগড়ার কারণ হয়েছে?</li>
      <li>আপনি কি সবসময় ক্ষতি পুষিয়ে নিতে ফিরে আসেন?</li>
      <li>আপনি কি বাজি ধরার জন্য টাকা ধার করেছেন?</li>
      <li>আপনি কি গেমিংকে আয়ের উৎস হিসেবে দেখেন?</li>
      <li>গেমিং সীমিত করা কি আপনার জন্য কঠিন?</li>
      </ul>
      <h2>কী করবেন?</h2>
      <p>নিচে গেমিং সমস্যায় সহায়তাকারী কিছু স্বনামধন্য সংস্থার তালিকা দেওয়া হলো, যাদের সাথে যেকোনো সময় যোগাযোগ করা যায়:</p>
      <ul>
      <li>Gamblers Anonymous</li>
      <li>Gambling Therapy</li>
      <li>GamCare</li>
      </ul>
      <h2>আমরা কীভাবে সাহায্য করতে পারি?</h2>
      <p>যারা নিজের গেমিং আচরণ নিয়ে উদ্বিগ্ন, তাদের আমরা নিজের অ্যাকাউন্ট থেকে সেলফ-এক্সক্লুশন করে বিরতি নিতে পরামর্শ দিই। সেলফ-এক্সক্লুশন কমপক্ষে ৬ মাসের জন্য আপনার অ্যাকাউন্ট লক করবে এবং কোনো প্রচারমূলক বার্তা পাঠানো হবে না।</p>
      <p>এটি অনুরোধ করতে যেকোনো সময় আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন, তারা আপনাকে সহায়তা করবে। ৭ দিনের কুলিং-অফ সময়ও উপলব্ধ। আপনার অন্য যেসব গেমিং সাইটে অ্যাকাউন্ট আছে সেখানেও সেলফ-এক্সক্লুশন অনুরোধ করার পরামর্শ দিই।</p>
      <h2>নাবালকদের গেমিং</h2>
      <p>খেলোয়াড়দের নিজ এখতিয়ারে আইনসম্মত গেমিং বয়সের (কমপক্ষে ১৮+) হতে হবে। বয়সসীমা সম্পর্কে সচেতন থাকা তাদের দায়িত্ব। আমরা অভিভাবকদের নিম্নলিখিত পরামর্শ দিই:</p>
      <ul>
      <li>কম্পিউটার, মোবাইল ও ট্যাবলেট পাসওয়ার্ড দিয়ে সুরক্ষিত রাখুন।</li>
      <li>অ্যাকাউন্টে লগইন থাকা অবস্থায় ডিভাইস অযত্নে রাখবেন না।</li>
      <li>সকল অ্যাকাউন্ট তথ্য ও কার্ড শিশুদের নাগালের বাইরে রাখুন।</li>
      <li>কম্পিউটারে পাসওয়ার্ড সংরক্ষণ করবেন না; লিখে নিরাপদ স্থানে রাখুন।</li>
      <li>নাবালকদের অনুপযুক্ত সাইটে প্রবেশ ঠেকাতে ফিল্টারিং সফটওয়্যার (যেমন Net Nanny) ব্যবহার করুন।</li>
      </ul>
    `,
  },
  'for-age-18-and-above-only': {
    title: 'For age 18 and above only?',
    body: `
      <p>Mega Casino World is only made available to customers aged 18 and above only. The act of a customer under the age of 18 opening an account and/or gambling on Mega Casino World is considered as an offence. Mega Casino World carries out age-verifications and reserves the right to carry out such verifications at our own discretion. The company has responsibilities to carry out age verifications and we take it very seriously. Customers that have been requested to complete age verifications will not be able to use any of our payment services until the age verification is complete. Mega Casino World reserves the rights to suspend your account while pending for your age verification.</p>
      <p><strong>NOTE: IF ANY CUSTOMERS BELOW 18 YEARS OF AGE IS FOUND USING MEGA CASINO WORLD, THE COMPANY RESERVES THE RIGHTS TO BLOCK THE ACCOUNT AND FORFEIT ALL WINNINGS.</strong></p>
      <div>&nbsp;</div>
      <h4>Filtering Systems</h4>
      <p>Mega Casino World strongly encourages and advises all its customers to ensure that minors would not access any e-gaming websites.</p>
      <p>Parents can regulate internet access with filtering solutions based on selected criteria. With filtering solutions, parents can regulate internet access and prevent minors from accessing e-gaming websites. Filtering solutions can deny access to Mega Casino World after detecting the content on our site and the solutions can achieve that because we label our website. If your device is shared among family and friends who are minors, please consider using parental filtering solutions to deny them access to Mega Casino World.</p>
    `,
    titleBn: 'শুধুমাত্র ১৮ বছর ও তার বেশি বয়সীদের জন্য',
    bodyBn: `
      <p>মেগা ক্যাসিনো ওয়ার্ল্ড শুধুমাত্র ১৮ বছর ও তার বেশি বয়সী গ্রাহকদের জন্য উপলব্ধ। ১৮ বছরের কম বয়সী কারও অ্যাকাউন্ট খোলা বা বাজি ধরা অপরাধ হিসেবে গণ্য। আমরা বয়স যাচাই করি এবং নিজস্ব বিবেচনায় তা করার অধিকার সংরক্ষণ করি। বয়স যাচাই সম্পন্ন না হওয়া পর্যন্ত গ্রাহক কোনো পেমেন্ট সেবা ব্যবহার করতে পারবেন না।</p>
      <p><strong>দ্রষ্টব্য: ১৮ বছরের কম বয়সী কাউকে মেগা ক্যাসিনো ওয়ার্ল্ড ব্যবহার করতে দেখা গেলে কোম্পানি অ্যাকাউন্ট ব্লক এবং সমস্ত জেতা টাকা বাজেয়াপ্ত করার অধিকার রাখে।</strong></p>
      <h4>ফিল্টারিং সিস্টেম</h4>
      <p>মেগা ক্যাসিনো ওয়ার্ল্ড দৃঢ়ভাবে পরামর্শ দেয় যেন নাবালকরা কোনো ই-গেমিং ওয়েবসাইটে প্রবেশ করতে না পারে।</p>
      <p>অভিভাবকরা ফিল্টারিং সমাধান ব্যবহার করে ইন্টারনেট প্রবেশ নিয়ন্ত্রণ করতে এবং নাবালকদের ই-গেমিং সাইটে প্রবেশ ঠেকাতে পারেন। ডিভাইস পরিবার বা বন্ধুদের সাথে শেয়ার করা হলে, নাবালকদের প্রবেশ ঠেকাতে অভিভাবকীয় ফিল্টারিং সমাধান ব্যবহার করুন।</p>
    `,
  },
  'faq': {
    title: 'আমরা কীভাবে আপনাকে সাহায্য করতে পারি?',
    body: `
      <div style="display: flex; justify-content: center; margin-bottom: 24px;">
          <input type="text" placeholder="এখানে আপনার প্রশ্নটি অনুসন্ধান করুন বা টাইপ করুন।" style="width: 100%; max-width: 600px; padding: 12px; border-radius: 4px; border: 1px solid #555; background: #222; color: #fff; font-size: 16px;" />
      </div>
      <p class="content-page__lead" style="text-align: center;">এইগুলি MCW সম্পর্কে কিছু সাধারণ প্রশ্ন এবং উত্তর। আপনি যদি নীচের তালিকায় আপনার প্রশ্নটি খুঁজে না পান, দয়া করে আমাদের গ্রাহক সহায়তার সাথে যোগাযোগ করুন।</p>

      <details class="faq-item" open><summary>কীভাবে আমি একটি অ্যাকাউন্ট খুলব?</summary><div class="faq-item__body">সাইন আপ-এ ক্লিক করুন, আপনার মুদ্রা চয়ন করুন, একটি ব্যবহারকারীর নাম, পাসওয়ার্ড এবং ফোন নম্বর লিখুন, যাচাইকরণ কোডটি সম্পূর্ণ করুন এবং জমা দিন। নিবন্ধন করার জন্য আপনার বয়স ১৮ বা তার বেশি হতে হবে।</div></details>
      <details class="faq-item"><summary>আমি কীভাবে জমা দেব?</summary><div class="faq-item__body">লগ ইন করুন, ডিপোজিট পেজটি খুলুন, একটি পেমেন্ট পদ্ধতি নির্বাচন করুন, পরিমাণ লিখুন এবং স্ক্রিনের নির্দেশাবলী অনুসরণ করুন। নিশ্চিত হওয়ার কিছুক্ষণ পরেই আপনার মেইন ওয়ালেটে তহবিল দেখা যাবে।</div></details>
      <details class="faq-item"><summary>আমি কীভাবে আমার জয়ের টাকা তুলব?</summary><div class="faq-item__body">উইথড্রয়াল পেজটি খুলুন, আপনার পদ্ধতি নির্বাচন করুন, পরিমাণ লিখুন এবং নিশ্চিত করুন। টাকা তোলার আগে পরিচয় যাচাইকরণ (KYC) প্রয়োজন হতে পারে।</div></details>
      <details class="faq-item"><summary>খেলার ন্যূনতম বয়স কত?</summary><div class="faq-item__body">আমাদের পরিষেবাগুলি কঠোরভাবে ১৮ বা তার বেশি বয়সী প্রাপ্তবয়স্কদের জন্য। নাবালকদের অ্যাকাউন্ট বন্ধ হতে পারে এবং জেতা টাকা বাজেয়াপ্ত হতে পারে।</div></details>
      <details class="faq-item"><summary>আমি পাসওয়ার্ড ভুলে গেছি - আমি কী করব?</summary><div class="faq-item__body">লগইন উইন্ডোতে "পাসওয়ার্ড ভুলে গেছেন?" লিঙ্কটি ব্যবহার করুন এবং এটি পুনরায় সেট করার পদক্ষেপগুলি অনুসরণ করুন। আরও সাহায্যের প্রয়োজন হলে সাপোর্টে যোগাযোগ করুন।</div></details>
      <details class="faq-item"><summary>বোনাস এবং প্রমোশন কীভাবে কাজ করে?</summary><div class="faq-item__body">উপলব্ধ অফারগুলি প্রমোশন পেজে তালিকাভুক্ত করা আছে। প্রতিটি প্রমোশনের নিজস্ব শর্ত, যোগ্যতা এবং বাজির প্রয়োজনীয়তা রয়েছে - দয়া করে গ্রহণ করার আগে এগুলি পড়ুন।</div></details>
      <details class="faq-item"><summary>আমার কি আমার পরিচয় যাচাই (KYC) করতে হবে?</summary><div class="faq-item__body">পরিচয় যাচাইকরণের অনুরোধ করা হতে পারে, বিশেষত টাকা তোলা বা বড় লেনদেনের জন্য। আপনাকে সরকার প্রদত্ত ছবির আইডি, আইডি হাতে একটি সেলফি এবং একটি ঠিকানার প্রমাণ যেমন একটি ব্যাঙ্ক স্টেটমেন্ট বা ইউটিলিটি বিল আপলোড করতে বলা হতে পারে।</div></details>
      <details class="faq-item"><summary>আমার তথ্য এবং টাকা কি নিরাপদ?</summary><div class="faq-item__body">হ্যাঁ - আমরা আপনার ডেটা এবং তহবিল সুরক্ষিত রাখতে এনক্রিপশন এবং সুরক্ষা নিয়ন্ত্রণগুলি ব্যবহার করি। বিস্তারিত জানার জন্য আমাদের <a class="inline" href="security.html">নিরাপত্তা</a> এবং <a class="inline" href="privacy-policy.html">গোপনীয়তা নীতি</a> পেজগুলি দেখুন।</div></details>
      <details class="faq-item"><summary>আমি কীভাবে সাপোর্টের সাথে যোগাযোগ করব?</summary><div class="faq-item__body">আমাদের গ্রাহক সহায়তা দল লাইভ চ্যাট এবং ইমেলের মাধ্যমে ২৪/৭ উপলব্ধ।</div></details>
    `
  }
};

export default function CmsPageRoute() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { locale } = useI18n();
  const { themeKey } = useTheme();
  const { tenant } = useTenant();
  const { PublicLayout } = getThemeComponents(themeKey);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cms', 'page', tenant.slug, slug],
    queryFn: () => cmsApi.getPage(slug, tenant.slug),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const fallback = FALLBACK_PAGES[slug];
  const displayData = fallback
    ? { title: (locale === 'bn' && fallback.titleBn) || fallback.title, body: (locale === 'bn' && fallback.bodyBn) || fallback.body }
    : data;
  const showLoading = isLoading && !fallback;

  return (
    <PublicLayout>
      <article className="content-page">
        {showLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !displayData ? (
          <div className="text-center">
            <h1 className="mb-2 text-xl font-bold text-white">Page not found</h1>
            <p className="text-sm text-muted">This page is unavailable.</p>
          </div>
        ) : (
          <>
            <h1>{displayData.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: displayData.body }} />
          </>
        )}
      </article>
    </PublicLayout>
  );
}
