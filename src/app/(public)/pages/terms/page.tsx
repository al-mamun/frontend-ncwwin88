/**
 * Static Terms & Conditions page (no CMS / no login needed).
 *
 * This static `terms` segment takes precedence over the dynamic `[slug]` CMS
 * route, so the content here is baked into the frontend build. Wrapped in the
 * active theme's PublicLayout so the site header/footer match the rest of the
 * public site. Generic template — review before relying on it legally.
 */

'use client';

import { useTheme } from '../../../../core/theme/ThemeProvider';
import { useI18n } from '../../../../core/i18n/LanguageProvider';
import { useTenant } from '../../../../core/tenant/TenantProvider';
import { getThemeComponents } from '../../../../themes/components';

export default function TermsPage() {
  const { themeKey } = useTheme();
  const { tenant } = useTenant();
  const { PublicLayout } = getThemeComponents(themeKey);
  const { locale } = useI18n();

  const bodyEn = `
          <p><strong>Last updated: 02.07.2024</strong></p>

          1.<strong>Introduction</strong>
          <p>These terms and conditions and the documents referred to below (the “Terms”) apply to the use of the current website (the “Website”) and its related or connected services (collectively, the “Service”).</p>
          <p>You should carefully review these Terms as they contain important information concerning your rights and obligations concerning the use of the Website and form a binding legal agreement between you – our customer (the “Customer”), and us. By using this Website and/or accessing the Service, you, whether you are a guest or a registered user with an account (“Account”), agree to be bound by these Terms, together with any amendments, which may be published from time to time. If you do not accept these Terms, you should refrain from accessing the Service and using the Website.</p>
          <p>The Service is owned by NCW Consultancy Ltd., a limited liability company registered in Anjouan with company registration number 15733, with registered address at Hamchako, Mutsamudu, Autonomous Island of Anjouan, Union of Comoros., (“Company”), licensed in the State of Anjouan under the Computer Gaming Licensing Act 007 of 2005.</p>
          
          2.<strong>General Terms</strong>
          <p>We reserve the right to revise and amend the Terms (including any documents referred to and linked to below) at any time. You should visit this page periodically to review the Terms and Conditions. Amendments will be binding and effective immediately upon publication on this Website. If you object to any such changes, you must immediately stop using the Service. Your continued use of the Website following such publication will indicate your agreement to be bound by the Terms as amended. Any bets not settled prior to the changed Terms taking effect will be subject to the pre-existing Terms.</p>
          
          3.<strong>Your Obligations</strong>
          <p>You acknowledge that at all times when accessing the Website and using the Service:</p>
          <p>3.1. You are is over 18, or the legal age at which gambling, or gaming activities are allowed under the law or jurisdiction that applies to you. We reserve the right to request proof of age documents from you at any time.</p>
          <p>3.2. You are of legal capacity and can enter into a binding legal agreement with us. You must not access the Website or utilize the Service if you are not of legal capacity.</p>
          <p>3.3. You are a resident in a jurisdiction that allows gambling. You are not a resident of any country in which access to online gambling to its residents or to any person within such country is prohibited. It is your sole responsibility to ensure that your use of the service is legal.</p>
          <p>3.4. You may not use a VPN, proxy or similar services or devices that mask or manipulate the identification of your real location.</p>
          <p>3.5. You are the authorized user of the payment method you use.</p>
          <p>3.6. You must make all payments to us in good faith and not attempt to reverse a payment made or take any action which will cause such payment to be reversed by a third party.</p>
          <p>3.7. When placing bets you may lose some or all of your money deposited to the Service in accordance with these Terms and you will be fully responsible for that loss.</p>
          <p>3.8. When placing bets you must not use any information obtained in breach of any legislation in force in the country in which you were when the bet was placed.</p>
          <p>3.9. You are not acting on behalf of another party or for any commercial purposes, but solely on your own behalf as a private individual in a personal capacity.</p>
          <p>3.10. You must not either attempt to manipulate any market or element within the Service in bad faith nor in a manner that adversely affects the integrity of the Service or us.</p>
          <p>3.11. You must generally act in good faith in relation to us of the Service at all times and for all bets made using the Service.</p>
          <p>3.12. You, or, if applicable, your employees, employers, agents, or family members, are not registered as an Affiliate in our Affiliate program.</p>
          
          <ol>
          <li><strong>4. Restricted use</strong></li>
          </ol>
          <p>4.1. You must not use the Service:</p>
          <p>4.1.1. If you are under the age of 18 years (or below the age of majority as stipulated in the laws of the jurisdiction applicable to you) or if you are not legally able to enter into a binding legal agreement with us or you acting as an agent for, or otherwise on behalf, of a person under 18 years (or below the age of majority as stipulated in the laws of the jurisdiction applicable to you);</p>
          <p>4.1.2. If you reside in a country in which access to online gambling to its residents or to any person within such country is prohibited.</p>
          <p>4.1.3. If you are a resident of one of the following countries, or accessing the Website from one of the following countries:</p>
          <p>a. Country is not one of the following Restricted Countries:</p>
          <ul>
          <li>Austria</li>
          <li>France and it’s territories</li>
          <li>Germany</li>
          <li>Netherlands and it’s territories</li>
          <li>Spain</li>
          <li>Union of Comoros</li>
          <li>United Kingdom</li>
          <li>USA and it’s territories</li>
          <li>All FATF Blacklisted countries,</li>
          <li>any other jurisdictions deemed prohibited by Anjouan Offshore Financial Authority.</li>
          </ul>
          <p>4.1.4. To collect nicknames, e-mail addresses and/or other information of other Customers by any means (for example, by sending spam, other types of unsolicited emails or the unauthorised framing of, or linking to, the Service);</p>
          <p>4.1.5. to disrupt or unduly affect or influence the activities of other Customers or the operation of the Service generally;</p>
          <p>4.1.6. to promote unsolicited commercial advertisements, affiliate links, and other forms of solicitation which may be removed from the Service without notice;</p>
          <p>4.1.7. in any way which, in our reasonable opinion, could be considered as an attempt to: (i) cheat the Service or another Customer using the Service; or (ii) collude with any other Customer using the Service in order to obtain a dishonest advantage;</p>
          <p>4.1.8. to scrape our odds or violate any of our Intellectual Property Rights; or</p>
          <p>4.1.9. for any unlawful activity whatsoever.</p>
          <p>4.2. You cannot sell or transfer your account to third parties, nor can you acquire a player account from a third party.</p>
          <p>4.3. You may not, in any manner, transfer funds between player accounts.</p>
          <p>4.4. We may immediately terminate your Account upon written notice to you if you use the Service for unauthorised purposes. We may also take legal action against you for doing so in certain circumstances.</p>
          <p>4.5. Employees of Company, its licensees, distributors, wholesalers, subsidiaries, advertising, promotional or other agencies, media partners, contractors, retailers and members of the immediate families of each are NOT allowed to use the Service for real money without prior consent from the Company Director or CEO. Should such activity be discovered, the account(s) will be immediately terminated and all bonuses/winnings will be forfeited.</p>
          
          <ol>
          <li><strong>Registration</strong></li>
          </ol>
          <p>You agree that at all times when using the Service:</p>
          <p>5.1. We reserve the right to refuse to accept a registration application from any applicant at our sole discretion and without any obligation to communicate a specific reason.</p>
          <p>5.2. Before using the Service, you must personally complete the registration form and read and accept these Terms. In order to start betting on the Service or withdraw your winnings, we may require you to become a verified Customer which includes passing certain checks. You may be required to provide a valid proof of identification and any other document as it may be deemed necessary. This includes but is not limited to, a picture ID (copy of passport, driver’s licence or national ID card) and a recent utility bill listing your name and address as proof of residence. We reserve the right to suspend wagering or restrict Account options on any Account until the required information is received. This procedure is done in accordance with the applicable gaming regulation and the anti-money laundering legal requirements. Additionally, you will need to fund your Service Account using the payment methods set out on the payment section of our Website.</p>
          <p>5.3. You have to provide accurate contact information, inclusive of a valid email address (“Registered Email Address”), and update such information in the future to keep it accurate. It is your responsibility to keep your contact details up to date on your Account. Failure to do so may result in you failing to receive important Account related notifications and information from us, including changes we make to these Terms. We identify and communicate with our Customers via their Registered Email Address. It is the responsibility of the Customer to maintain an active and unique email account, to provide us with the correct email address and to advise Company of any changes in their email address. Each Customer is wholly responsible for maintaining the security of his Registered Email Address to prevent the use of his Registered Email Address by any third party. Company shall not be responsible for any damages or losses deemed or alleged to have resulted from communications between Company and the Customer using the Registered Email Address. Any Customer not having an email address reachable by Company will have his Account suspended until such an address is provided to us. We will immediately suspend your Account upon written notice to you to this effect if you intentionally provide false or inaccurate personal information. We may also take legal action against you for doing so in certain circumstances and/or contact the relevant authorities who may also take action against you.</p>
          <p>5.4. You are only allowed to register one Account with the Service. Accounts are subject to immediate closure if it is found that you have multiple Accounts registered with us. This includes the use of representatives, relatives, associates, affiliates, related parties, connected persons and/or third parties operating on your behalf.</p>
          <p>5.5. In order to ensure your financial worthiness and to confirm your identity, we may ask you to provide us with additional personal information, such as your name and surname, or use any third-party information providers we consider necessary. Should any additional personal information be obtained via third-party sources, we will inform you about the data obtained.</p>
          <p>5.6. You must keep your password for the Service confidential. Provided that the Account information requested has been correctly supplied, we are entitled to assume that bets, deposits and withdrawals have been made by you. We advise you to change your password on a regular basis and never disclose it to any third party. It is your responsibility to protect your password and any failure to do so shall be at your sole risk and expense. You may log out of the Service at the end of each session. If you believe any of your Account information is being misused by a third party, or your Account has been hacked into, or your password has been discovered by a third party, you must notify us immediately. You must notify us if your Registered Email Address has been hacked into, we may, however, require you to provide additional information/ documentation so that we can verify your identity. We will immediately suspend your Account once we are aware of such an incident. In the meantime you are responsible for all activity on your Account including third party access, regardless of whether or not their access was authorised by you.</p>
          <p>5.7. You must not at any time transmit any content or other information on the Service to another Customer or any other party by way of a screen capture (or other similar method), nor display any such information or content in a frame or in any other manner that is different from how it would appear if such Customer or third party had typed the URL for the Service into the browser line.</p>
          <p>5.8. When registering, you will receive possibility to use all currencies available on the website. Those will be the currencies of your deposits, withdrawals and bets placed and matched into the Service as set out in these Terms. Some payment methods do not process in all currencies. In such cases a processing currency will be displayed, along with a conversion calculator available on the page.</p>
          <p>5.9. We are under no obligation to open an Account for you and our website sign-up page is merely an invitation to treat. It is entirely within our sole discretion whether or not to proceed with the opening of an Account for you and, should we refuse to open an Account for you, we are under no obligation to provide you with a reason for the refusal.</p>
          <p>5.10. Upon receipt of your application, we may be in touch to request further information and/ or documentation from you in order for us to comply with our regulatory and legal obligations.</p>
          
          <ol>
          <li><strong>Your Account</strong></li>
          </ol>
          <p>6.1. Accounts could use several currencies, in this case all Account balances and transactions appear in the currency used for the transaction.</p>
          <p>6.2. We do not give credit for the use of the Service.</p>
          <p>6.3. We may close or suspend an Account if you are not or we reasonably believe that you are not complying with these Terms, or to ensure the integrity or fairness of the Service or if we have other reasonable grounds to do so. We may not always be able to give you prior notice. If we close or suspend your Account due to you not complying with these Terms, we may cancel and/or void any of your bets and withhold any money in your account (including the deposit).</p>
          <p>6.4. We reserve the right to close or suspend any Account without prior notice and return all funds. Contractual obligations already matured will however be honoured.</p>
          <p>6.5. We reserve the right to refuse, restrict, cancel or limit any wager at any time for whatever reason, including any bet perceived to be placed in a fraudulent manner in order to circumvent our betting limits and/ or our system regulations.</p>
          <p>6.6. If any amount is mistakenly credited to your Account it remains our property and when we become aware of any such mistake, we shall notify you and the amount will be withdrawn from your Account.</p>
          <p>6.7. If, for any reason, your Account goes overdrawn, you shall be in debt to us for the amount overdrawn.</p>
          <p>6.8. You must inform us as soon as you become aware of any errors with respect to your Account.</p>
          <p>6.9. Please remember that betting is purely for entertainment and pleasure and you should stop as soon as it stops being fun. Absolutely do not bet anything you can’t afford to lose. If you feel that you may have lost control of your gambling, we offer a self-exclusion option. Just send a message to our Customer Support Department using your Registered Email Address that you wish to SELF-EXCLUDE and this request will take effect within 24 hours from the moment of its receipt. In this case your account will be disabled until your further notice, and you won’t be able to login to it.</p>
          <p>6.10. You cannot transfer, sell, or pledge Your Account to another person. This prohibition includes the transfer of any assets of value of any kind, including but not limited to ownership of accounts, winnings, deposits, bets, rights and/or claims in connection with these assets, legal, commercial or otherwise. The prohibition on said transfers also includes however is not limited to the encumbrance, pledging, assigning, usufruct, trading, brokering, hypothecation and/or gifting in cooperation with a fiduciary or any other third party, company, natural or legal individual, foundation and/or association in any way shape or form</p>
          <p>6.11. Should you wish to close your account with us, please send an email from your Registered Email Address to our Customer Support Department via the links on the Website.</p>
          
          <ol>
          <li><strong>Deposit of Funds</strong></li>
          </ol>
          <p>7.1. All deposits should be made from an account or payment system or credit card that is registered in your own name, and any deposits made in any other currency will be converted using the daily exchange rate obtained from oanda.com, or at our own bank’s or our payment processor’s prevailing rate of exchange following which your Account will be deposited accordingly. Note that some payment systems may apply additional currency exchange fees which will be deducted from the sum of your deposit.</p>
          <p>7.2. Fees and charges may apply to customer deposits and withdrawals, which can be found on the Website. In most cases we absorb transaction fees for deposits to your account. You are responsible for your own bank charges that you may incur due to depositing funds with us.</p>
          <p>7.3. Company is not a financial institution and uses a third party electronic payment processors to process credit and debit card deposits; they are not processed directly by us. If you deposit funds by either a credit card or a debit card, your Account will only be credited if we receive an approval and authorisation code from the payment issuing institution. If your card issuer gives no such authorisation, your Account will not be credited with those funds.</p>
          <p>7.4. You agree to fully pay any and all payments and charges due to us or to payment providers in connection with your use of the Service. You further agree not to make any charge-backs or renounce or cancel or otherwise reverse any of your deposits, and in any such event you will refund and compensate us for such unpaid deposits including any expenses incurred by us in the process of collecting your deposit, and you agree that any winnings from wagers utilising those charged back funds will be forfeited. You acknowledge and agree that your player account is not a bank account and is therefore not guaranteed, insured or otherwise protected by any deposit or banking insurance system or by any other similar insurance system of any other jurisdiction, including but not limited to your local jurisdiction. Furthermore, the player account does not bear interest on any of the funds held in it.</p>
          <p>7.5. If you decide to accept any of our promotional or bonus offer by entering a bonus code during deposit, you agree to the Terms of Bonuses and terms of each specific bonus.</p>
          <p>7.6. Funds originating from criminal and/or illegal and/or unauthorized activities must not be deposited with us.</p>
          <p>7.7. If you deposit using your credit card, it is recommended that you retain a copy of Transaction Records and a copy of these Terms.</p>
          <p>7.8. Internet Gambling may be illegal in the jurisdiction in which you are located; if so, you are not authorized to use your payment card to deposit on this site. It is your responsibility to know the laws concerning online gambling in your country of domicile.</p>
          
          <ol>
          <li><strong>Withdrawal of Funds</strong></li>
          </ol>
          <p>8.1. You may withdraw any unutilized and cleared funds held in your player account by submitting a withdrawal request in accordance with our withdrawal conditions. The minimum withdrawal amount per transaction is € 10 (or equivalent in other currency) with the exception of an account closure in which case you may withdraw the full balance.</p>
          <p>8.2. There are no withdrawal commissions if you roll over (wager) the deposit at least 1 time. Otherwise we are entitled to deduct a 8% fee with minimum sum of 4 euro (or equivalent in your account currency) in order to combat money laundering.</p>
          <p>8.3. We reserve the right to request photo ID, address confirmation or perform additional verification procedures (request your selfie, arrange a verification call etc.) for the purpose of identity verification prior to granting any withdrawals from your Account. We also reserve our rights to perform identity verification at any time during the lifetime of your relationship with us.</p>
          <p>8.4. All withdrawals must be made to the original debit, credit card, bank account, method of payment used to make the payment to your Account. We may, and always at our own discretion, allow you to withdraw to a payment method from which your original deposit did not originate. This will always be subject to additional security checks.</p>
          <p>8.5. Should you wish to withdraw funds but your account is either inaccessible, dormant, locked or closed, please contact our Customer Service Department.</p>
          <p>8.6. In cases when your balance is at least 10 times larger than the total sum of your deposits, you will be limited to € 5,000 (or currency equivalent) for withdrawal per month. In other cases the maximum withdrawal amount per month is € 10,000.</p>
          <p>8.7. Please note that we cannot guarantee successful processing of withdrawals or refunds in the event if you breach the Restricted use policy stated in Clauses 3.3 and 4.</p>
          
          <ol>
          <li><strong>Payment Transactions and Processors</strong></li>
          </ol>
          <p>9.1. You are fully responsible for paying all monies owed to us. You must make all payments to us in good faith and not attempt to reverse a payment made or take any action which will cause such payment to be reversed by a third party in order to avoid a liability legitimately incurred. You will reimburse us for any charge-backs, denial or reversal of payment you make and any loss suffered by us as a consequence thereof. We reserve the right to also impose an administration fee of €50, or currency equivalent per charge-back, denial or reversal of payment you make.</p>
          <p>9.2. We reserve the right to use third party electronic payment processors and or merchant banks to process payments made by you and you agree to be bound by their terms and conditions providing they are made aware to you and those terms do not conflict with these Terms.</p>
          <p>9.3. All transactions made on our site might be checked to prevent money laundering or terrorism financing activity. Suspicious transactions will be reported to the relevant authority.</p>
          
          <ol>
          <li><strong>Errors</strong></li>
          </ol>
          <p>10.1. In the event of an error or malfunction of our system or processes, all bets are rendered void. You are under an obligation to inform us immediately as soon as you become aware of any error with the Service. In the event of communication or system errors or bugs or viruses occurring in connection with the Service and/or payments made to you as a result of a defect or error in the Service, we will not be liable to you or to any third party for any direct or indirect costs, expenses, losses or claims arising or resulting from such errors, and we reserve the right to void all games/bets in question and take any other action to correct such errors.</p>
          <p>10.2. We make every effort to ensure that we do not make errors in posting bookmaker lines. However, if as a result of human error or system problems a bet is accepted at an odd that is: materially different from those available in the general market at the time the bet was made; or clearly incorrect given the chance of the event occurring at the time the bet was made then we reserve the right to cancel or void that wager, or to cancel or void a wager made after an event has started.</p>
          <p>10.3. We have the right to recover from you any amount overpaid and to adjust your Account to rectify any mistake. An example of such a mistake might be where a price is incorrect or where we enter a result of an event incorrectly. If there are insufficient funds in your Account, we may demand that you pay us the relevant outstanding amount relating to any erroneous bets or wagers. Accordingly, we reserve the right to cancel, reduce or delete any pending plays, whether placed with funds resulting from the error or not.</p>
          
          <ol>
          <li><strong>Rules of Play, refunds and cancellations</strong></li>
          </ol>
          <p>11.1. The winner of an event will be determined on the date of the event’s settlement, and we will not recognize protested or overturned decisions for wagering purposes.</p>
          <p>11.2. All results posted shall be final after 72 hours and no queries will be entertained after that period of time. Within 72 hours after results are posted, we will only reset/correct the results due to human error, system error or mistakes made by the referring results source.</p>
          <p>11.3. If a match result is overturned for any reason by the governing body of the match within the payout period then all money will be refunded.</p>
          <p>11.4. If a draw occurs in a game where a draw option is offered all stakes on a team win or lose will be lost. If a draw option is not offered then everyone receives a refund in the outcome of a draw on the match. And if a draw option has not been made available, then extra time will count, if played.</p>
          <p>11.5. If a result cannot be validated by us, for instance if the feed broadcasting the event is interrupted (and cannot be verified by another source) then at our election, the wagers on that event will be deemed invalid and wagers refunded.</p>
          <p>11.6. Minimum and maximum wager amounts on all events will be determined by us and are subject to change without prior written notice. We also reserve the right to adjust limits on individual Accounts as well.</p>
          <p>11.7. Customers are solely responsible for their own Account transactions. Once a transaction is complete, it cannot be changed. We do not take responsibility for missing or duplicate wagers made by the Customer and will not entertain discrepancy requests because a play is missing or duplicated. Customers may review their transactions in the My Account section of the site after each session to ensure all requested wagers were accepted.</p>
          <p>11.8. A matchup will have action as long as the two teams are correct, and regardless of the League header in which it is placed on our Website.</p>
          <p>11.9. The start dates and times displayed on the Website for eSport matches are an indication only and are not guaranteed to be correct. If a match is suspended or postponed, and not resumed within 72 hours from the actual scheduled start time, the match will have no action and wagers will be refunded. The exception being any wager on whether a team/player advances in a tournament, or wins the tournament, will have action regardless of a suspended or postponed match.</p>
          <p>11.10. If an event is posted by us with an incorrect date, all wagers have action based on the date announced by the governing body.</p>
          <p>11.11. If a team is using stand-ins, the result is still valid as it was the team’s choice to use the stand-ins.</p>
          <p>11.12. Company reserves the right to remove events, markets and any other products from the Website.</p>
          <p>11.13. In-depth explanation of our sports betting rules is on the separate page: SPORTS BETTING RULES</p>
          
          <ol>
          <li><strong>Communications and Notices</strong></li>
          </ol>
          <p>12.1. All communications and notices to be given under these Terms by you to us shall be sent using a Customer Support form on the Website.</p>
          <p>12.2. All communications and notices to be given under these Terms by us to you shall, unless otherwise specified in these Terms, be either posted on the Website and/or sent to the Registered Email Address we hold on our system for the relevant Customer. The method of such communication shall be in our sole and exclusive discretion.</p>
          <p>12.3. All communications and notices to be given under these Terms by either you or us shall be in writing in the English language and must be given to and from the Registered Email Address in your Account.</p>
          <p>12.4. From time to time, we may contact you by email for the purpose of offering you information about betting, unique promotional offerings, and other information from official channels. You agree to receive such emails when you agree to these Terms when registering at the Website. You can choose to opt out of receiving such promotional offerings from us at any time by submitting a request to the Customer Support.</p>
          
          <ol>
          <li><strong>Matters Beyond Our Control</strong></li>
          </ol>
          <p>We cannot be held liable for any failure or delay in providing the Service due to an event of Force Majeure which could reasonably be considered to be outside our control despite our execution of reasonable preventative measures such as: an act of God; trade or labour dispute; power cut; act, failure or omission of any government or authority; obstruction or failure of telecommunication services; or any other delay or failure caused by a third party, and we will not be liable for any resulting loss or damage that you may suffer. In such an event, we reserve the right to cancel or suspend the Service without incurring any liability.</p>
          
          <ol>
          <li><strong>Liability</strong></li>
          </ol>
          <p>14.1. TO THE EXTENT PERMITTED BY APPLICABLE LAW, WE WILL NOT COMPENSATE YOU FOR ANY REASONABLY FORESEEABLE LOSS OR DAMAGE (EITHER DIRECT OR INDIRECT) YOU MAY SUFFER IF WE FAIL TO CARRY OUT OUR OBLIGATIONS UNDER THESE TERMS UNLESS WE BREACH ANY DUTIES IMPOSED ON US BY LAW (INCLUDING IF WE CAUSE DEATH OR PERSONAL INJURY BY OUR NEGLIGENCE) IN WHICH CASE WE SHALL NOT BE LIABLE TO YOU IF THAT FAILURE IS ATTRIBUTED TO: (I) YOUR OWN FAULT; (II) A THIRD PARTY UNCONNECTED WITH OUR PERFORMANCE OF THESE TERMS (FOR INSTANCE PROBLEMS DUE TO COMMUNICATIONS NETWORK PERFORMANCE, CONGESTION, AND CONNECTIVITY OR THE PERFORMANCE OF YOUR COMPUTER EQUIPMENT); OR (III) ANY OTHER EVENTS WHICH NEITHER WE NOR OUR SUPPLIERS COULD HAVE FORESEEN OR FORESTALLED EVEN IF WE OR THEY HAD TAKEN REASONABLE CARE. AS THIS SERVICE IS FOR CONSUMER USE ONLY WE WILL NOT BE LIABLE FOR ANY BUSINESS LOSSES OF ANY KIND.</p>
          <p>14.2. IN THE EVENT THAT WE ARE HELD LIABLE FOR ANY EVENT UNDER THESE TERMS, OUR TOTAL AGGREGATE LIABILITY TO YOU UNDER OR IN CONNECTION WITH THESE TERMS SHALL NOT EXCEED (A) THE VALUE OF THE BETS AND OR WAGERS YOU PLACED VIA YOUR ACCOUNT IN RESPECT OF THE RELEVANT BET/WAGER OR PRODUCT THAT GAVE RISE TO THE RELEVANT LIABILITY, OR (B) EUR €500 IN AGGREGATE, WHICHEVER IS LOWER.</p>
          <p>14.3. WE STRONGLY RECOMMEND THAT YOU (I) TAKE CARE TO VERIFY THE SUITABILITY AND COMPATIBILITY OF THE SERVICE WITH YOUR OWN COMPUTER EQUIPMENT PRIOR TO USE; AND (II) TAKE REASONABLE PRECAUTIONS TO PROTECT YOURSELF AGAINST HARMFUL PROGRAMS OR DEVICES INCLUDING THROUGH INSTALLATION OF ANTI-VIRUS SOFTWARE.</p>
          
          <ol>
          <li><strong>Gambling By Those Under Age</strong></li>
          </ol>
          <p>15.1. If we suspect that you are or receive notification that you are currently under 18 years or were under 18 years (or below the age of majority as stipulated in the laws of the jurisdiction applicable to you) when you placed any bets through the Service your Account will be suspended (locked) to prevent you placing any further bets or making any withdrawals from your Account. We will then investigate the matter, including whether you have been betting as an agent for, or otherwise on behalf, of a person under 18 years (or below the age of majority as stipulated in the laws of the jurisdiction applicable to you). If having found that you: (a) are currently; (b) were under 18 years or below the majority age which applies to you at the relevant time; or (c) have been betting as an agent for or at the behest of a person under 18 years or below the majority age which applies: all winnings currently or due to be credited to your Account will be retained; all winnings gained from betting through the Service whilst under age must be paid to us on demand (if you fail to comply with this provision we will seek to recover all costs associated with recovery of such sums); and/or any monies deposited in your Account which are not winnings will be returned to you OR retained until you turn 18 years old at our sole discretion. We reserve the right to deduct payment transaction fees from the amount to return, including transaction fees for deposits to your account which we covered.</p>
          <p>15.2. This condition also applies to you if you are over the age of 18 years but you are placing your bets within a jurisdiction which specifies a higher age than 18 years for legal betting and you are below that legal minimum age in that jurisdiction.</p>
          <p>15.3. In the event we suspect you are in breach of the provisions of this Clause or are attempting to rely on them for a fraudulent purpose, we reserve the right to take any action necessary in order to investigate the matter, including informing the relevant law enforcement agencies.</p>
          
          <ol>
          <li><strong>Fraud</strong></li>
          </ol>
          <p>We will seek criminal and contractual sanctions against any Customer involved in fraud, dishonesty or criminal acts. We will withhold payment to any Customer where any of these are suspected. The Customer shall indemnify and shall be liable to pay to us on demand all costs, charges or losses sustained or incurred by us (including any direct, indirect or consequential losses, loss of profit, loss of business and loss of reputation) arising directly or indirectly from the Customer’s fraud, dishonesty or criminal act.</p>
          
          <ol>
          <li><strong>Intellectual Property</strong></li>
          </ol>
          <p>17.1. Any unauthorised use of our name and logo may result in legal action being taken against you.</p>
          <p>17.2. As between us and you, we are the sole owners of the rights in and to the Service, our technology, software and business systems (the “Systems”) as well as our odds.<br>you must not use your personal profile for your own commercial gain (such as selling your status update to an advertiser); and<br>when selecting a nickname for your Account we reserve the right to remove or reclaim it if we believe it appropriate.</p>
          <p>17.3. You may not use our URL, trademarks, trade names and/or trade dress, logos (“Marks”) and/or our odds in connection with any product or service that is not ours, that in any manner is likely to cause confusion among Customers or in the public or that in any manner disparages us.</p>
          <p>17.4. Except as expressly provided in these Terms, we and our licensors do not grant you any express or implied rights, license, title or interest in or to the Systems or the Marks and all such rights, license, title and interest specifically retained by us and our licensors. You agree not to use any automatic or manual device to monitor or copy web pages or content within the Service. Any unauthorized use or reproduction may result in legal action being taken against you.</p>
          
          <ol>
          <li><strong>Your License</strong></li>
          </ol>
          <p>18.1. Subject to these Terms and your compliance with them, we grant to you a non-exclusive, limited, non transferable and non sub-licensable license to access and use the Service for your personal non-commercial purposes only. Our license to you terminates if our agreement with you under these Terms ends.</p>
          <p>18.2. Save in respect of your own content, you may not under any circumstances modify, publish, transmit, transfer, sell, reproduce, upload, post, distribute, perform, display, create derivative works from, or in any other manner exploit, the Service and/or any of the content thereon or the software contained therein, except as we expressly permit in these Terms or otherwise on the Website. No information or content on the Service or made available to you in connection with the Service may be modified or altered, merged with other data or published in any form including for example screen or database scraping and any other activity intended to collect, store, reorganise or manipulate such information or content.</p>
          <p>18.3. Any non-compliance by you with this Clause may also be a violation of our or third parties’ intellectual property and other proprietary rights which may subject you to civil liability and/or criminal prosecution.</p>
          
          <ol>
          <li><strong>Your Conduct and Safety</strong></li>
          </ol>
          <p>19.1. For your protection and protection of all our Customers, the posting of any content on the Service, as well as conduct in connection therewith and/or the Service, which is in any way unlawful, inappropriate or undesirable is strictly prohibited (“Prohibited Behaviour”).</p>
          <p>19.2. If you engage in Prohibited Behaviour, or we determine in our sole discretion that you are engaging in Prohibited Behaviour, your Account and/or your access to or use of the Service may be terminated immediately without notice to you. Legal action may be taken against you by another Customer, other third party, enforcement authorities and/or us with respect to you having engaged in Prohibited Behaviour.</p>
          <p>19.3. Prohibited Behaviour includes, but is not limited to, accessing or using the Service to: promote or share information that you know is false, misleading or unlawful; conduct any unlawful or illegal activity, such as, but not limited to, any activity that furthers or promotes any criminal activity or enterprise, violates another Customer’s or any other third party’s privacy or other rights or that creates or spreads computer viruses; harm minors in any way; transmit or make available any content that is unlawful, harmful, threatening, abusive, tortuous, defamatory, vulgar, obscene, lewd, violent, hateful, or racially or ethnically or otherwise objectionable; transmit or make available any content that the user does not have a right to make available under any law or contractual or fiduciary relationship, including without limitation, any content that infringes a third party’s copyright, trademark or other intellectual property and proprietary rights; transmit or make available any content or material that contains any software virus or other computer or programming code (including HTML) designed to interrupt, destroy or alter the functionality of the Service, its presentation or any other website, computer software or hardware; interfere with, disrupt or reverse engineer the Service in any manner, including, without limitation, intercepting, emulating or redirecting the communication protocols used by us, creating or using cheats, mods or hacks or any other software designed to modify the Service, or using any software that intercepts or collects information from or through the Service; retrieve or index any information from the Service using any robot, spider or other automated mechanism; participate in any activity or action that, in the sole and entire unfettered discretion of us results or may result in another Customer being defrauded or scammed;<br>transmit or make available any unsolicited or unauthorised advertising or mass mailing such as, but not limited to, junk mail, instant messaging, “spim”, “spam”, chain letters, pyramid schemes or other forms of solicitations; create Accounts on the Website by automated means or under false or fraudulent pretences; impersonate another Customer or any other third party, or any other act or thing done that we reasonably consider to be contrary to our business principles.</p>
          <p>The above list of Prohibited Behaviour is not exhaustive and may be modified by us at any time or from time to time. We reserve the right to investigate and to take all such actions as we in our sole discretion deem appropriate or necessary under the circumstances, including without limitation deleting the Customer’s posting(s) from the Service and/or terminating their Account, and take any action against any Customer or third party who directly or indirectly in, or knowingly permits any third party to directly or indirectly engage in Prohibited Behaviour, with or without notice to such Customer or third party.</p>
          
          <ol>
          <li><strong>Links to Other Websites</strong></li>
          </ol>
          <p>The Service may contain links to third party websites that are not maintained by, or related to, us, and over which we have no control. Links to such websites are provided solely as a convenience to Customers, and are in no way investigated, monitored or checked for accuracy or completeness by us. Links to such websites do not imply any endorsement by us of, and/or any affiliation with, the linked websites or their content or their owner(s). We have no control over or responsibility for the availability nor their accuracy, completeness, accessibility and usefulness. Accordingly when accessing such websites we recommend that you should take the usual precautions when visiting a new website including reviewing their privacy policy and terms of use.</p>
          
          <ol>
          <li><strong>Complaints</strong></li>
          </ol>
          <p>21.1. If you have any concerns or questions regarding these Terms you should contact our Customer Service Department via the links on the Website and use your Registered Email Address in all communication with us.</p>
          <p>21.2. NOTWITHSTANDING THE FOREGOING, WE TAKE NO LIABILITY WHATSOEVER TO YOU OR TO ANY THIRD PARTY WHEN RESPONDING TO ANY COMPLAINT THAT WE RECEIVED OR TOOK ACTION IN CONNECTION THEREWITH.</p>
          <p>21.3. If a Customer is not satisfied with how a bet has been settled then the Customer should provide details of their grievance to our Customer Service Department. We shall use our reasonable endeavours to respond to queries of this nature within a few days (and in any event we intend to respond to all such queries within 28 days of receipt).</p>
          <p>21.4. Disputes must be lodged within three (3) days from the date the wager in question has been decided. No claims will be honoured after this period. The Customer is solely responsible for their Account transactions.</p>
          <p>21.5. In the event of a dispute arising between you and us our Customer Service Department will attempt to reach an agreed solution. Should our Customer Service Department be unable to reach an agreed solution with you, the matter will be escalated to our management.</p>
          <p>21.6. Should all efforts to resolve a dispute to the Customer’s satisfaction have failed, the Customer has the right to have the dispute settled via arbitration.</p>
          
          <ol>
          <li><strong>Assignment</strong></li>
          </ol>
          <p>Neither these Terms nor any of the rights or obligations hereunder may be assigned by you without the prior written consent of us, which consent will not be unreasonably withheld. We may, without your consent, assign all or any portion of our rights and obligations hereunder to any third party provided such third party is able to provide a service of substantially similar quality to the Service by posting written notice to this effect on the Service.</p>
          
          <ol>
          <li><strong>Severability</strong></li>
          </ol>
          <p>In the event that any provision of these Terms is deemed by any competent authority to be unenforceable or invalid, the relevant provision shall be modified to allow it to be enforced in line with the intention of the original text to the fullest extent permitted by applicable law. The validity and enforceability of the remaining provisions of these Terms shall not be affected.</p>
          
          <ol>
          <li><strong>Breach of These Terms</strong></li>
          </ol>
          <p>Without limiting our other remedies, we may suspend or terminate your Account and refuse to continue to provide you with the Service, in either case without giving you prior notice, if, in our reasonable opinion, you breach any material term of these Terms. Notice of any such action taken will, however, be promptly provided to you.</p>
          
          <ol>
          <li><strong>General Provisions</strong></li>
          </ol>
          <p>25.1. Term of agreement. These Terms shall remain in full force and effect while you access or use the Service or are a Customer or visitor of the Website. These Terms will survive the termination of your Account for any reason.</p>
          <p>25.2. Gender. Words importing the singular number shall include the plural and vice versa, words importing the masculine gender shall include the feminine and neuter genders and vice versa and words importing persons shall include individuals, partnerships, associations, trusts, unincorporated organisations and corporations.</p>
          <p>25.3. Waiver. No waiver by us, whether by conduct or otherwise, of a breach or threatened breach by you of any term or condition of these Terms shall be effective against, or binding upon, us unless made in writing and duly signed by us, and, unless otherwise provided in the written waiver, shall be limited to the specific breach waived. The failure of us to enforce at any time any term or condition of these Terms shall not be construed to be a waiver of such provision or of the right of us to enforce such provision at any other time.</p>
          <p>25.4. Acknowledgement. By hereafter accessing or using the Service, you acknowledge having read, understood and agreed to each and every paragraph of these Terms. As a result, you hereby irrevocably waive any future argument, claim, demand or proceeding to the contrary of anything contained in these Terms.</p>
          <p>25.5. Language. In the event of there being a discrepancy between the English language version of these rules and any other language version, the English language version will be deemed to be correct.</p>
          <p>25.6. Governing Law. These Terms are governed excsluively by the law in force in the state of Anjouan in the Union of Comoros.</p>
          <p>25.7. Entire agreement. These Terms constitute the entire agreement between you and us with respect to your access to and use of the Service, and supersedes all other prior agreements and communications, whether oral or written with respect to the subject matter hereof.</p>
        `;

  const bodyBn = `
          <p><strong>সর্বশেষ হালনাগাদ: ০২.০৭.২০২৪</strong></p>

          ১.<strong>ভূমিকা</strong>
          <p>এই শর্তাবলী এবং নিচে উল্লিখিত নথিসমূহ (“Terms”) বর্তমান ওয়েবসাইট (“Website”) এবং এর সম্পর্কিত বা সংযুক্ত সেবাসমূহ (সম্মিলিতভাবে “Service”) ব্যবহারের ক্ষেত্রে প্রযোজ্য।</p>
          <p>আপনি এই শর্তাবলী মনোযোগ সহকারে পর্যালোচনা করবেন কারণ এতে ওয়েবসাইট ব্যবহার সংক্রান্ত আপনার অধিকার ও দায়িত্ব সম্পর্কে গুরুত্বপূর্ণ তথ্য রয়েছে এবং এটি আপনি – আমাদের গ্রাহক (“Customer”) – এবং আমাদের মধ্যে একটি বাধ্যতামূলক আইনি চুক্তি গঠন করে। এই ওয়েবসাইট ব্যবহার করে এবং/অথবা সেবায় প্রবেশ করে, আপনি – অতিথি হোন বা একটি অ্যাকাউন্টসহ নিবন্ধিত ব্যবহারকারী (“Account”) হোন – এই শর্তাবলী এবং সময়ে সময়ে প্রকাশিত হতে পারে এমন যেকোনো সংশোধনী মেনে চলতে সম্মত হন। আপনি যদি এই শর্তাবলী গ্রহণ না করেন, তবে সেবায় প্রবেশ করা এবং ওয়েবসাইট ব্যবহার করা থেকে বিরত থাকবেন।</p>
          <p>এই সেবার মালিক NCW Consultancy Ltd., যা Anjouan-এ নিবন্ধিত একটি সীমিত দায়বদ্ধ কোম্পানি, কোম্পানি নিবন্ধন নম্বর 15733, নিবন্ধিত ঠিকানা Hamchako, Mutsamudu, Autonomous Island of Anjouan, Union of Comoros., (“Company”), যা Computer Gaming Licensing Act 007 of 2005 এর অধীনে State of Anjouan-এ লাইসেন্সপ্রাপ্ত।</p>
          
          ২.<strong>সাধারণ শর্তাবলী</strong>
          <p>আমরা যেকোনো সময় শর্তাবলী (নিচে উল্লিখিত ও লিঙ্ককৃত যেকোনো নথিসহ) পুনর্বিবেচনা ও সংশোধন করার অধিকার সংরক্ষণ করি। আপনি নিয়মিতভাবে এই পৃষ্ঠা পরিদর্শন করে শর্তাবলী পর্যালোচনা করবেন। এই ওয়েবসাইটে প্রকাশের সাথে সাথেই সংশোধনী বাধ্যতামূলক ও কার্যকর হবে। আপনি যদি এমন কোনো পরিবর্তনে আপত্তি জানান, তবে অবিলম্বে সেবা ব্যবহার বন্ধ করতে হবে। এমন প্রকাশের পর ওয়েবসাইট ব্যবহার অব্যাহত রাখলে তা নির্দেশ করবে যে আপনি সংশোধিত শর্তাবলী মেনে চলতে সম্মত। পরিবর্তিত শর্তাবলী কার্যকর হওয়ার আগে নিষ্পত্তি না হওয়া যেকোনো বাজি পূর্বের বিদ্যমান শর্তাবলীর অধীন থাকবে।</p>
          
          ৩.<strong>আপনার দায়িত্ব</strong>
          <p>আপনি স্বীকার করেন যে ওয়েবসাইটে প্রবেশ এবং সেবা ব্যবহারের সকল সময়ে:</p>
          <p>৩.১. আপনার বয়স ১৮ বছরের বেশি, অথবা আপনার ক্ষেত্রে প্রযোজ্য আইন বা এখতিয়ারের অধীনে জুয়া বা গেমিং কার্যক্রম যে বৈধ বয়সে অনুমোদিত সেই বয়সের বেশি। আমরা যেকোনো সময় আপনার কাছে বয়সের প্রমাণপত্র চাওয়ার অধিকার সংরক্ষণ করি।</p>
          <p>৩.২. আপনার আইনগত সক্ষমতা রয়েছে এবং আপনি আমাদের সাথে একটি বাধ্যতামূলক আইনি চুক্তিতে প্রবেশ করতে পারেন। আপনার আইনগত সক্ষমতা না থাকলে আপনি ওয়েবসাইটে প্রবেশ বা সেবা ব্যবহার করবেন না।</p>
          <p>৩.৩. আপনি এমন একটি এখতিয়ারের বাসিন্দা যেখানে জুয়া অনুমোদিত। আপনি এমন কোনো দেশের বাসিন্দা নন যেখানে বাসিন্দাদের বা সেই দেশের যেকোনো ব্যক্তির জন্য অনলাইন জুয়ায় প্রবেশ নিষিদ্ধ। আপনার সেবার ব্যবহার বৈধ কিনা তা নিশ্চিত করা একান্তই আপনার দায়িত্ব।</p>
          <p>৩.৪. আপনি VPN, প্রক্সি বা অনুরূপ সেবা বা ডিভাইস ব্যবহার করবেন না যা আপনার প্রকৃত অবস্থানের শনাক্তকরণ গোপন বা কারসাজি করে।</p>
          <p>৩.৫. আপনি যে অর্থপ্রদান পদ্ধতি ব্যবহার করেন তার অনুমোদিত ব্যবহারকারী।</p>
          <p>৩.৬. আপনি অবশ্যই সরল বিশ্বাসে আমাদের সকল অর্থপ্রদান করবেন এবং কৃত কোনো অর্থপ্রদান বিপরীত করার চেষ্টা করবেন না বা এমন কোনো পদক্ষেপ নেবেন না যা তৃতীয় পক্ষ দ্বারা সেই অর্থপ্রদান বিপরীত হতে পারে।</p>
          <p>৩.৭. বাজি ধরার সময় এই শর্তাবলী অনুসারে সেবায় জমাকৃত আপনার কিছু বা সমস্ত অর্থ আপনি হারাতে পারেন এবং সেই ক্ষতির জন্য আপনি সম্পূর্ণরূপে দায়ী থাকবেন।</p>
          <p>৩.৮. বাজি ধরার সময় বাজি ধরার মুহূর্তে আপনি যে দেশে ছিলেন সেখানে বলবৎ কোনো আইন লঙ্ঘন করে প্রাপ্ত কোনো তথ্য আপনি ব্যবহার করবেন না।</p>
          <p>৩.৯. আপনি অন্য কোনো পক্ষের পক্ষে বা কোনো বাণিজ্যিক উদ্দেশ্যে কাজ করছেন না, বরং কেবল একজন ব্যক্তিগত সত্তা হিসেবে নিজের পক্ষে কাজ করছেন।</p>
          <p>৩.১০. আপনি অসৎ উদ্দেশ্যে বা সেবার সততা বা আমাদের ওপর বিরূপ প্রভাব ফেলে এমনভাবে সেবার কোনো বাজার বা উপাদান কারসাজি করার চেষ্টা করবেন না।</p>
          <p>৩.১১. সেবার ব্যবহারে আমাদের সাথে এবং সেবা ব্যবহার করে ধরা সকল বাজির ক্ষেত্রে আপনি সবসময় সাধারণভাবে সরল বিশ্বাসে কাজ করবেন।</p>
          <p>৩.১২. আপনি, অথবা প্রযোজ্য হলে আপনার কর্মচারী, নিয়োগকর্তা, এজেন্ট বা পরিবারের সদস্যরা আমাদের অ্যাফিলিয়েট প্রোগ্রামে অ্যাফিলিয়েট হিসেবে নিবন্ধিত নন।</p>
          
          <ol>
          <li><strong>৪. সীমিত ব্যবহার</strong></li>
          </ol>
          <p>৪.১. আপনি সেবা ব্যবহার করবেন না:</p>
          <p>৪.১.১. আপনার বয়স ১৮ বছরের কম হলে (অথবা আপনার ক্ষেত্রে প্রযোজ্য এখতিয়ারের আইনে নির্ধারিত সাবালকত্বের বয়সের নিচে হলে) অথবা আপনি আইনগতভাবে আমাদের সাথে একটি বাধ্যতামূলক আইনি চুক্তিতে প্রবেশ করতে সক্ষম না হলে অথবা আপনি ১৮ বছরের কম বয়সী কোনো ব্যক্তির (অথবা আপনার ক্ষেত্রে প্রযোজ্য এখতিয়ারের আইনে নির্ধারিত সাবালকত্বের বয়সের নিচের কারও) এজেন্ট হিসেবে বা অন্যথায় তার পক্ষে কাজ করলে;</p>
          <p>৪.১.২. আপনি এমন কোনো দেশে বসবাস করলে যেখানে সেই দেশের বাসিন্দাদের বা যেকোনো ব্যক্তির জন্য অনলাইন জুয়ায় প্রবেশ নিষিদ্ধ।</p>
          <p>৪.১.৩. আপনি নিম্নলিখিত দেশগুলোর কোনো একটির বাসিন্দা হলে, অথবা নিম্নলিখিত দেশগুলোর কোনো একটি থেকে ওয়েবসাইটে প্রবেশ করলে:</p>
          <p>ক. দেশটি নিম্নলিখিত সীমিত দেশগুলোর একটি নয়:</p>
          <ul>
          <li>Austria</li>
          <li>France and it’s territories</li>
          <li>Germany</li>
          <li>Netherlands and it’s territories</li>
          <li>Spain</li>
          <li>Union of Comoros</li>
          <li>United Kingdom</li>
          <li>USA and it’s territories</li>
          <li>সকল FATF কালো তালিকাভুক্ত দেশ,</li>
          <li>Anjouan Offshore Financial Authority কর্তৃক নিষিদ্ধ বলে বিবেচিত অন্য যেকোনো এখতিয়ার।</li>
          </ul>
          <p>৪.১.৪. অন্য গ্রাহকদের ডাকনাম, ই-মেইল ঠিকানা এবং/অথবা অন্যান্য তথ্য যেকোনো উপায়ে সংগ্রহ করতে (উদাহরণস্বরূপ, স্প্যাম, অন্যান্য ধরনের অযাচিত ই-মেইল পাঠিয়ে অথবা সেবার অননুমোদিত ফ্রেমিং বা লিঙ্কিং করে);</p>
          <p>৪.১.৫. অন্য গ্রাহকদের কার্যকলাপ বা সাধারণভাবে সেবার পরিচালনায় ব্যাঘাত ঘটাতে বা অযথা প্রভাবিত করতে;</p>
          <p>৪.১.৬. অযাচিত বাণিজ্যিক বিজ্ঞাপন, অ্যাফিলিয়েট লিঙ্ক এবং অন্যান্য ধরনের প্ররোচনা প্রচার করতে, যা কোনো নোটিশ ছাড়াই সেবা থেকে সরিয়ে ফেলা হতে পারে;</p>
          <p>৪.১.৭. এমন কোনোভাবে যা আমাদের যৌক্তিক মতামতে বিবেচিত হতে পারে: (i) সেবা বা সেবা ব্যবহারকারী অন্য কোনো গ্রাহকের সাথে প্রতারণার চেষ্টা হিসেবে; অথবা (ii) অসৎ সুবিধা লাভের জন্য সেবা ব্যবহারকারী অন্য কোনো গ্রাহকের সাথে যোগসাজশ হিসেবে;</p>
          <p>৪.১.৮. আমাদের অডস স্ক্র্যাপ করতে বা আমাদের কোনো মেধাস্বত্ব অধিকার লঙ্ঘন করতে; অথবা</p>
          <p>৪.১.৯. যেকোনো বেআইনি কার্যকলাপের জন্য।</p>
          <p>৪.২. আপনি আপনার অ্যাকাউন্ট তৃতীয় পক্ষের কাছে বিক্রি বা হস্তান্তর করতে পারবেন না, এবং তৃতীয় পক্ষের কাছ থেকে কোনো প্লেয়ার অ্যাকাউন্ট অর্জনও করতে পারবেন না।</p>
          <p>৪.৩. আপনি কোনোভাবেই প্লেয়ার অ্যাকাউন্টগুলোর মধ্যে তহবিল স্থানান্তর করতে পারবেন না।</p>
          <p>৪.৪. আপনি অননুমোদিত উদ্দেশ্যে সেবা ব্যবহার করলে আমরা আপনাকে লিখিত নোটিশ দিয়ে অবিলম্বে আপনার অ্যাকাউন্ট বন্ধ করতে পারি। কিছু পরিস্থিতিতে এমন করার জন্য আমরা আপনার বিরুদ্ধে আইনি ব্যবস্থাও নিতে পারি।</p>
          <p>৪.৫. Company-র কর্মচারী, এর লাইসেন্সধারী, পরিবেশক, পাইকারি বিক্রেতা, সহযোগী প্রতিষ্ঠান, বিজ্ঞাপন, প্রচারমূলক বা অন্যান্য এজেন্সি, মিডিয়া অংশীদার, ঠিকাদার, খুচরা বিক্রেতা এবং এদের প্রত্যেকের নিকটাত্মীয় সদস্যরা Company Director বা CEO-এর পূর্ব সম্মতি ছাড়া আসল অর্থে সেবা ব্যবহার করার অনুমতিপ্রাপ্ত নন। এমন কার্যকলাপ আবিষ্কৃত হলে, অ্যাকাউন্ট(সমূহ) অবিলম্বে বন্ধ করে দেওয়া হবে এবং সকল বোনাস/জয় বাজেয়াপ্ত করা হবে।</p>
          
          <ol>
          <li><strong>নিবন্ধন</strong></li>
          </ol>
          <p>আপনি সম্মত হন যে সেবা ব্যবহারের সকল সময়ে:</p>
          <p>৫.১. আমরা কোনো নির্দিষ্ট কারণ জানানোর বাধ্যবাধকতা ছাড়াই, আমাদের নিজস্ব বিবেচনায় যেকোনো আবেদনকারীর নিবন্ধন আবেদন গ্রহণে অস্বীকৃতি জানানোর অধিকার সংরক্ষণ করি।</p>
          <p>৫.২. সেবা ব্যবহারের আগে, আপনাকে অবশ্যই ব্যক্তিগতভাবে নিবন্ধন ফরম পূরণ করতে হবে এবং এই শর্তাবলী পড়ে গ্রহণ করতে হবে। সেবায় বাজি শুরু করতে বা আপনার জয় উত্তোলন করতে, আমরা আপনাকে একজন যাচাইকৃত গ্রাহক হতে বলতে পারি, যার মধ্যে নির্দিষ্ট কিছু যাচাই সম্পন্ন করা অন্তর্ভুক্ত। আপনাকে একটি বৈধ পরিচয়ের প্রমাণ এবং প্রয়োজনীয় বলে বিবেচিত অন্য যেকোনো নথি প্রদান করতে বলা হতে পারে। এর মধ্যে অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয়, একটি ছবিযুক্ত পরিচয়পত্র (পাসপোর্ট, ড্রাইভিং লাইসেন্স বা জাতীয় পরিচয়পত্রের অনুলিপি) এবং আপনার নাম ও ঠিকানা সম্বলিত একটি সাম্প্রতিক ইউটিলিটি বিল বসবাসের প্রমাণ হিসেবে। প্রয়োজনীয় তথ্য না পাওয়া পর্যন্ত আমরা যেকোনো অ্যাকাউন্টে বাজি স্থগিত বা অ্যাকাউন্ট অপশন সীমিত করার অধিকার সংরক্ষণ করি। এই পদ্ধতি প্রযোজ্য গেমিং নিয়ন্ত্রণ এবং মানি লন্ডারিং প্রতিরোধ সংক্রান্ত আইনি প্রয়োজনীয়তা অনুসারে সম্পন্ন করা হয়। এছাড়াও, আমাদের ওয়েবসাইটের পেমেন্ট বিভাগে উল্লিখিত অর্থপ্রদান পদ্ধতি ব্যবহার করে আপনাকে আপনার সেবা অ্যাকাউন্টে অর্থ জমা করতে হবে।</p>
          <p>৫.৩. আপনাকে অবশ্যই সঠিক যোগাযোগের তথ্য প্রদান করতে হবে, যার মধ্যে একটি বৈধ ই-মেইল ঠিকানা (“Registered Email Address”) অন্তর্ভুক্ত, এবং ভবিষ্যতে তা সঠিক রাখতে এই তথ্য হালনাগাদ করতে হবে। আপনার অ্যাকাউন্টে যোগাযোগের বিবরণ হালনাগাদ রাখা আপনার দায়িত্ব। এটি না করলে আমাদের কাছ থেকে অ্যাকাউন্ট সংক্রান্ত গুরুত্বপূর্ণ বিজ্ঞপ্তি ও তথ্য, এই শর্তাবলীতে আমরা যে পরিবর্তন করি তা সহ, আপনি নাও পেতে পারেন। আমরা আমাদের গ্রাহকদের তাদের Registered Email Address-এর মাধ্যমে শনাক্ত করি ও যোগাযোগ করি। একটি সক্রিয় ও অনন্য ই-মেইল অ্যাকাউন্ট বজায় রাখা, আমাদের সঠিক ই-মেইল ঠিকানা প্রদান করা এবং তাদের ই-মেইল ঠিকানার যেকোনো পরিবর্তন সম্পর্কে Company-কে অবহিত করা গ্রাহকের দায়িত্ব। প্রতিটি গ্রাহক তার Registered Email Address-এর নিরাপত্তা বজায় রাখার জন্য সম্পূর্ণভাবে দায়ী যাতে কোনো তৃতীয় পক্ষ তার Registered Email Address ব্যবহার করতে না পারে। Registered Email Address ব্যবহার করে Company ও গ্রাহকের মধ্যে যোগাযোগ থেকে উদ্ভূত বলে বিবেচিত বা অভিযুক্ত কোনো ক্ষয়ক্ষতির জন্য Company দায়ী থাকবে না। Company-র নাগালযোগ্য ই-মেইল ঠিকানা নেই এমন যেকোনো গ্রাহকের অ্যাকাউন্ট, এমন একটি ঠিকানা আমাদের প্রদান না করা পর্যন্ত স্থগিত রাখা হবে। আপনি ইচ্ছাকৃতভাবে মিথ্যা বা ভুল ব্যক্তিগত তথ্য প্রদান করলে আমরা এই মর্মে আপনাকে লিখিত নোটিশ দিয়ে অবিলম্বে আপনার অ্যাকাউন্ট স্থগিত করব। কিছু পরিস্থিতিতে এমন করার জন্য আমরা আপনার বিরুদ্ধে আইনি ব্যবস্থাও নিতে পারি এবং/অথবা সংশ্লিষ্ট কর্তৃপক্ষের সাথে যোগাযোগ করতে পারি যারা আপনার বিরুদ্ধে ব্যবস্থা নিতে পারে।</p>
          <p>৫.৪. আপনি সেবায় কেবল একটি অ্যাকাউন্ট নিবন্ধন করার অনুমতিপ্রাপ্ত। আপনার একাধিক অ্যাকাউন্ট আমাদের কাছে নিবন্ধিত আছে বলে জানা গেলে অ্যাকাউন্টগুলো অবিলম্বে বন্ধ করার সাপেক্ষে থাকবে। এর মধ্যে আপনার পক্ষে পরিচালিত প্রতিনিধি, আত্মীয়, সহযোগী, অ্যাফিলিয়েট, সম্পর্কিত পক্ষ, সংযুক্ত ব্যক্তি এবং/অথবা তৃতীয় পক্ষের ব্যবহার অন্তর্ভুক্ত।</p>
          <p>৫.৫. আপনার আর্থিক যোগ্যতা নিশ্চিত করতে এবং আপনার পরিচয় নিশ্চিত করতে, আমরা আপনার কাছে অতিরিক্ত ব্যক্তিগত তথ্য, যেমন আপনার নাম ও পদবি চাইতে পারি, অথবা আমরা প্রয়োজনীয় মনে করি এমন যেকোনো তৃতীয়-পক্ষ তথ্য সরবরাহকারী ব্যবহার করতে পারি। তৃতীয়-পক্ষ উৎস থেকে কোনো অতিরিক্ত ব্যক্তিগত তথ্য পাওয়া গেলে, আমরা প্রাপ্ত তথ্য সম্পর্কে আপনাকে অবহিত করব।</p>
          <p>৫.৬. আপনাকে অবশ্যই সেবার জন্য আপনার পাসওয়ার্ড গোপন রাখতে হবে। অনুরোধকৃত অ্যাকাউন্ট তথ্য সঠিকভাবে সরবরাহ করা হয়ে থাকলে, আমরা ধরে নিতে অধিকারী যে বাজি, জমা ও উত্তোলন আপনি করেছেন। আমরা আপনাকে নিয়মিতভাবে আপনার পাসওয়ার্ড পরিবর্তন করতে এবং কখনো কোনো তৃতীয় পক্ষের কাছে তা প্রকাশ না করতে পরামর্শ দিই। আপনার পাসওয়ার্ড রক্ষা করা আপনার দায়িত্ব এবং এতে ব্যর্থতা একান্তই আপনার ঝুঁকি ও খরচে হবে। প্রতিটি সেশনের শেষে আপনি সেবা থেকে লগ আউট করতে পারেন। আপনি যদি বিশ্বাস করেন যে আপনার অ্যাকাউন্ট তথ্য কোনো তৃতীয় পক্ষ অপব্যবহার করছে, অথবা আপনার অ্যাকাউন্ট হ্যাক হয়েছে, অথবা আপনার পাসওয়ার্ড কোনো তৃতীয় পক্ষ জেনে ফেলেছে, তবে আপনাকে অবিলম্বে আমাদের জানাতে হবে। আপনার Registered Email Address হ্যাক হলে আপনাকে আমাদের জানাতে হবে, তবে আমরা আপনার পরিচয় যাচাই করতে অতিরিক্ত তথ্য/নথি প্রদান করতে বলতে পারি। এমন কোনো ঘটনা সম্পর্কে অবগত হওয়ার সাথে সাথেই আমরা আপনার অ্যাকাউন্ট স্থগিত করব। ইতোমধ্যে, তৃতীয় পক্ষের প্রবেশসহ আপনার অ্যাকাউন্টের সকল কার্যকলাপের জন্য আপনি দায়ী, তাদের প্রবেশ আপনার দ্বারা অনুমোদিত ছিল কিনা তা নির্বিশেষে।</p>
          <p>৫.৭. আপনি কখনোই স্ক্রিন ক্যাপচার (বা অনুরূপ পদ্ধতি) এর মাধ্যমে সেবার কোনো কনটেন্ট বা অন্য তথ্য অন্য গ্রাহক বা অন্য কোনো পক্ষের কাছে প্রেরণ করবেন না, অথবা এমন কোনো তথ্য বা কনটেন্ট কোনো ফ্রেমে বা এমন অন্য কোনোভাবে প্রদর্শন করবেন না যা সেই গ্রাহক বা তৃতীয় পক্ষ ব্রাউজার লাইনে সেবার URL টাইপ করলে যেভাবে দেখাত তার থেকে ভিন্ন।</p>
          <p>৫.৮. নিবন্ধনের সময়, আপনি ওয়েবসাইটে উপলব্ধ সকল মুদ্রা ব্যবহারের সুযোগ পাবেন। এগুলোই হবে এই শর্তাবলীতে উল্লিখিত সেবায় আপনার জমা, উত্তোলন এবং ধরা ও মেলানো বাজির মুদ্রা। কিছু অর্থপ্রদান পদ্ধতি সব মুদ্রায় প্রক্রিয়া করে না। এমন ক্ষেত্রে একটি প্রক্রিয়াকরণ মুদ্রা প্রদর্শিত হবে, সাথে পৃষ্ঠায় উপলব্ধ একটি রূপান্তর ক্যালকুলেটর থাকবে।</p>
          <p>৫.৯. আপনার জন্য একটি অ্যাকাউন্ট খোলার কোনো বাধ্যবাধকতা আমাদের নেই এবং আমাদের ওয়েবসাইটের সাইন-আপ পৃষ্ঠা কেবল একটি আলোচনার আমন্ত্রণ মাত্র। আপনার জন্য একটি অ্যাকাউন্ট খোলার ব্যাপারে এগিয়ে যাব কিনা তা সম্পূর্ণরূপে আমাদের নিজস্ব বিবেচনার ওপর নির্ভরশীল এবং আপনার জন্য অ্যাকাউন্ট খুলতে অস্বীকৃতি জানালে, সেই অস্বীকৃতির কারণ আপনাকে প্রদানের কোনো বাধ্যবাধকতা আমাদের নেই।</p>
          <p>৫.১০. আপনার আবেদন পাওয়ার পর, আমাদের নিয়ন্ত্রক ও আইনি বাধ্যবাধকতা পূরণের জন্য আমরা আপনার কাছ থেকে আরও তথ্য এবং/অথবা নথি চাইতে যোগাযোগ করতে পারি।</p>
          
          <ol>
          <li><strong>আপনার অ্যাকাউন্ট</strong></li>
          </ol>
          <p>৬.১. অ্যাকাউন্টে একাধিক মুদ্রা ব্যবহার করা যেতে পারে, এই ক্ষেত্রে সকল অ্যাকাউন্ট ব্যালেন্স ও লেনদেন সেই লেনদেনের জন্য ব্যবহৃত মুদ্রায় প্রদর্শিত হয়।</p>
          <p>৬.২. আমরা সেবা ব্যবহারের জন্য কোনো ক্রেডিট প্রদান করি না।</p>
          <p>৬.৩. আপনি এই শর্তাবলী মেনে না চললে বা আমরা যুক্তিসঙ্গতভাবে বিশ্বাস করি যে আপনি মেনে চলছেন না, অথবা সেবার সততা বা ন্যায্যতা নিশ্চিত করতে অথবা এমন করার অন্য যৌক্তিক কারণ থাকলে আমরা একটি অ্যাকাউন্ট বন্ধ বা স্থগিত করতে পারি। আমরা সবসময় আপনাকে আগাম নোটিশ দিতে সক্ষম নাও হতে পারি। আপনি এই শর্তাবলী মেনে না চলার কারণে আমরা আপনার অ্যাকাউন্ট বন্ধ বা স্থগিত করলে, আমরা আপনার যেকোনো বাজি বাতিল এবং/অথবা অকার্যকর করতে পারি এবং আপনার অ্যাকাউন্টে থাকা যেকোনো অর্থ (জমাসহ) আটকে রাখতে পারি।</p>
          <p>৬.৪. আমরা আগাম নোটিশ ছাড়াই যেকোনো অ্যাকাউন্ট বন্ধ বা স্থগিত করার এবং সকল তহবিল ফেরত দেওয়ার অধিকার সংরক্ষণ করি। তবে ইতোমধ্যে পরিপক্ব হওয়া চুক্তিগত বাধ্যবাধকতা সম্মানিত হবে।</p>
          <p>৬.৫. আমরা যেকোনো সময় যেকোনো কারণে যেকোনো বাজি প্রত্যাখ্যান, সীমিত, বাতিল বা সীমাবদ্ধ করার অধিকার সংরক্ষণ করি, যার মধ্যে আমাদের বাজির সীমা এবং/অথবা সিস্টেম নিয়ন্ত্রণ এড়াতে প্রতারণামূলকভাবে ধরা হয়েছে বলে মনে হওয়া যেকোনো বাজি অন্তর্ভুক্ত।</p>
          <p>৬.৬. আপনার অ্যাকাউন্টে ভুলবশত কোনো পরিমাণ জমা হলে তা আমাদের সম্পত্তি হিসেবে থাকবে এবং এমন কোনো ভুল সম্পর্কে অবগত হলে আমরা আপনাকে জানাব এবং পরিমাণটি আপনার অ্যাকাউন্ট থেকে প্রত্যাহার করা হবে।</p>
          <p>৬.৭. যেকোনো কারণে আপনার অ্যাকাউন্ট ওভারড্রন হলে, ওভারড্রন পরিমাণের জন্য আপনি আমাদের কাছে ঋণী থাকবেন।</p>
          <p>৬.৮. আপনার অ্যাকাউন্ট সংক্রান্ত কোনো ত্রুটি সম্পর্কে অবগত হওয়ার সাথে সাথেই আপনাকে আমাদের জানাতে হবে।</p>
          <p>৬.৯. অনুগ্রহ করে মনে রাখবেন যে বাজি ধরা সম্পূর্ণরূপে বিনোদন ও আনন্দের জন্য এবং এটি যখন আর মজার না থাকে তখনই আপনার থামা উচিত। আপনি হারাতে সামর্থ্য নেই এমন কিছু কখনোই বাজি ধরবেন না। আপনি যদি মনে করেন যে আপনি আপনার জুয়ার নিয়ন্ত্রণ হারিয়ে ফেলেছেন, আমরা একটি স্ব-বর্জন (self-exclusion) অপশন অফার করি। শুধু আপনার Registered Email Address ব্যবহার করে আমাদের গ্রাহক সহায়তা বিভাগে একটি বার্তা পাঠান যে আপনি SELF-EXCLUDE করতে চান এবং এই অনুরোধটি গ্রহণের মুহূর্ত থেকে ২৪ ঘণ্টার মধ্যে কার্যকর হবে। এই ক্ষেত্রে আপনার অ্যাকাউন্ট আপনার পরবর্তী নোটিশ পর্যন্ত নিষ্ক্রিয় থাকবে, এবং আপনি এতে লগইন করতে পারবেন না।</p>
          <p>৬.১০. আপনি আপনার অ্যাকাউন্ট অন্য কোনো ব্যক্তির কাছে হস্তান্তর, বিক্রি বা বন্ধক রাখতে পারবেন না। এই নিষেধাজ্ঞার মধ্যে অন্তর্ভুক্ত যেকোনো ধরনের মূল্যবান সম্পদের হস্তান্তর, যার মধ্যে অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয় অ্যাকাউন্টের মালিকানা, জয়, জমা, বাজি, এবং এই সম্পদের সাথে সম্পর্কিত আইনি, বাণিজ্যিক বা অন্যান্য অধিকার এবং/অথবা দাবি। উক্ত হস্তান্তরের ওপর নিষেধাজ্ঞার মধ্যে আরও অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয় কোনো ফিডুশিয়ারি বা অন্য কোনো তৃতীয় পক্ষ, কোম্পানি, প্রাকৃতিক বা আইনি ব্যক্তি, ফাউন্ডেশন এবং/অথবা সমিতির সহযোগিতায় যেকোনো আকারে বা রূপে দায়বদ্ধতা, বন্ধক, অর্পণ, স্বত্বভোগ, বাণিজ্য, দালালি, হাইপোথিকেশন এবং/অথবা উপহার প্রদান।</p>
          <p>৬.১১. আপনি যদি আমাদের সাথে আপনার অ্যাকাউন্ট বন্ধ করতে চান, অনুগ্রহ করে ওয়েবসাইটের লিঙ্কের মাধ্যমে আপনার Registered Email Address থেকে আমাদের গ্রাহক সহায়তা বিভাগে একটি ই-মেইল পাঠান।</p>
          
          <ol>
          <li><strong>তহবিল জমা</strong></li>
          </ol>
          <p>৭.১. সকল জমা অবশ্যই আপনার নিজের নামে নিবন্ধিত একটি অ্যাকাউন্ট বা পেমেন্ট সিস্টেম বা ক্রেডিট কার্ড থেকে করতে হবে, এবং অন্য কোনো মুদ্রায় করা যেকোনো জমা oanda.com থেকে প্রাপ্ত দৈনিক বিনিময় হার ব্যবহার করে, অথবা আমাদের নিজস্ব ব্যাংক বা আমাদের পেমেন্ট প্রসেসরের প্রচলিত বিনিময় হারে রূপান্তরিত হবে, এরপর আপনার অ্যাকাউন্টে সেই অনুযায়ী জমা হবে। উল্লেখ্য যে কিছু পেমেন্ট সিস্টেম অতিরিক্ত মুদ্রা বিনিময় ফি প্রয়োগ করতে পারে যা আপনার জমার পরিমাণ থেকে কেটে নেওয়া হবে।</p>
          <p>৭.২. গ্রাহকের জমা ও উত্তোলনের ক্ষেত্রে ফি ও চার্জ প্রযোজ্য হতে পারে, যা ওয়েবসাইটে পাওয়া যাবে। বেশিরভাগ ক্ষেত্রে আমরা আপনার অ্যাকাউন্টে জমার জন্য লেনদেন ফি বহন করি। আমাদের কাছে তহবিল জমা করার কারণে আপনার যে ব্যাংক চার্জ হতে পারে তার জন্য আপনি নিজেই দায়ী।</p>
          <p>৭.৩. Company কোনো আর্থিক প্রতিষ্ঠান নয় এবং ক্রেডিট ও ডেবিট কার্ড জমা প্রক্রিয়া করতে তৃতীয়-পক্ষ ইলেকট্রনিক পেমেন্ট প্রসেসর ব্যবহার করে; এগুলো সরাসরি আমাদের দ্বারা প্রক্রিয়া করা হয় না। আপনি যদি ক্রেডিট কার্ড বা ডেবিট কার্ডের মাধ্যমে তহবিল জমা করেন, তবে পেমেন্ট ইস্যুকারী প্রতিষ্ঠান থেকে অনুমোদন ও অনুমোদন কোড পেলেই কেবল আপনার অ্যাকাউন্টে ক্রেডিট হবে। আপনার কার্ড ইস্যুকারী এমন কোনো অনুমোদন না দিলে, সেই তহবিল দিয়ে আপনার অ্যাকাউন্টে ক্রেডিট হবে না।</p>
          <p>৭.৪. সেবা ব্যবহারের সাথে সম্পর্কিত আমাদের বা পেমেন্ট প্রদানকারীদের কাছে প্রাপ্য সকল অর্থ ও চার্জ সম্পূর্ণরূপে পরিশোধ করতে আপনি সম্মত হন। আপনি আরও সম্মত হন যে কোনো চার্জ-ব্যাক করবেন না বা আপনার কোনো জমা প্রত্যাখ্যান, বাতিল বা অন্যথায় বিপরীত করবেন না, এবং এমন যেকোনো ক্ষেত্রে আপনি এমন অপরিশোধিত জমার জন্য আমাদের ক্ষতিপূরণ ও প্রতিদান দেবেন, যার মধ্যে আপনার জমা আদায়ের প্রক্রিয়ায় আমাদের হওয়া যেকোনো খরচ অন্তর্ভুক্ত, এবং আপনি সম্মত হন যে চার্জ-ব্যাক করা সেই তহবিল ব্যবহার করে বাজি থেকে অর্জিত যেকোনো জয় বাজেয়াপ্ত হবে। আপনি স্বীকার ও সম্মত হন যে আপনার প্লেয়ার অ্যাকাউন্ট একটি ব্যাংক অ্যাকাউন্ট নয় এবং তাই কোনো জমা বা ব্যাংকিং বিমা সিস্টেম বা অন্য কোনো এখতিয়ারের, যার মধ্যে অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয় আপনার স্থানীয় এখতিয়ার, অনুরূপ কোনো বিমা সিস্টেম দ্বারা গ্যারান্টিযুক্ত, বিমাকৃত বা অন্যথায় সুরক্ষিত নয়। উপরন্তু, প্লেয়ার অ্যাকাউন্টে থাকা কোনো তহবিলের ওপর কোনো সুদ বহন করে না।</p>
          <p>৭.৫. আপনি যদি জমার সময় একটি বোনাস কোড প্রবেশ করিয়ে আমাদের কোনো প্রচারমূলক বা বোনাস অফার গ্রহণ করার সিদ্ধান্ত নেন, তবে আপনি বোনাসের শর্তাবলী এবং প্রতিটি নির্দিষ্ট বোনাসের শর্তাবলীতে সম্মত হন।</p>
          <p>৭.৬. অপরাধমূলক এবং/অথবা বেআইনি এবং/অথবা অননুমোদিত কার্যকলাপ থেকে উদ্ভূত তহবিল আমাদের কাছে জমা করা যাবে না।</p>
          <p>৭.৭. আপনি যদি আপনার ক্রেডিট কার্ড ব্যবহার করে জমা করেন, তবে লেনদেনের রেকর্ডের একটি অনুলিপি এবং এই শর্তাবলীর একটি অনুলিপি সংরক্ষণ করার পরামর্শ দেওয়া হচ্ছে।</p>
          <p>৭.৮. আপনি যে এখতিয়ারে অবস্থিত সেখানে ইন্টারনেট জুয়া বেআইনি হতে পারে; এমন হলে, আপনি এই সাইটে জমা করতে আপনার পেমেন্ট কার্ড ব্যবহার করার অনুমতিপ্রাপ্ত নন। আপনার বসবাসের দেশে অনলাইন জুয়া সংক্রান্ত আইন জানা আপনার দায়িত্ব।</p>
          
          <ol>
          <li><strong>তহবিল উত্তোলন</strong></li>
          </ol>
          <p>৮.১. আপনি আমাদের উত্তোলন শর্তাবলী অনুসারে একটি উত্তোলন অনুরোধ জমা দিয়ে আপনার প্লেয়ার অ্যাকাউন্টে থাকা যেকোনো অব্যবহৃত ও ক্লিয়ারকৃত তহবিল উত্তোলন করতে পারেন। প্রতি লেনদেনে সর্বনিম্ন উত্তোলন পরিমাণ € 10 (বা অন্য মুদ্রায় সমতুল্য), অ্যাকাউন্ট বন্ধ করার ব্যতিক্রম ছাড়া, যে ক্ষেত্রে আপনি সম্পূর্ণ ব্যালেন্স উত্তোলন করতে পারেন।</p>
          <p>৮.২. আপনি যদি জমাটি অন্তত ১ বার রোল ওভার (বাজি) করেন তবে কোনো উত্তোলন কমিশন নেই। অন্যথায় মানি লন্ডারিং প্রতিরোধের জন্য আমরা সর্বনিম্ন ৪ ইউরো (বা আপনার অ্যাকাউন্ট মুদ্রায় সমতুল্য) সহ ৮% ফি কেটে নিতে অধিকারী।</p>
          <p>৮.৩. আপনার অ্যাকাউন্ট থেকে কোনো উত্তোলন মঞ্জুর করার আগে পরিচয় যাচাইয়ের উদ্দেশ্যে আমরা ছবিযুক্ত পরিচয়পত্র, ঠিকানা নিশ্চিতকরণ চাওয়ার বা অতিরিক্ত যাচাই পদ্ধতি সম্পাদন করার (আপনার সেলফি চাওয়া, একটি যাচাই কল আয়োজন ইত্যাদি) অধিকার সংরক্ষণ করি। আমরা আমাদের সাথে আপনার সম্পর্কের সময়কালে যেকোনো সময় পরিচয় যাচাই সম্পাদন করার অধিকারও সংরক্ষণ করি।</p>
          <p>৮.৪. সকল উত্তোলন অবশ্যই মূল ডেবিট, ক্রেডিট কার্ড, ব্যাংক অ্যাকাউন্ট, আপনার অ্যাকাউন্টে অর্থপ্রদানের জন্য ব্যবহৃত অর্থপ্রদান পদ্ধতিতে করতে হবে। আমরা, সবসময় আমাদের নিজস্ব বিবেচনায়, আপনাকে এমন একটি পেমেন্ট পদ্ধতিতে উত্তোলনের অনুমতি দিতে পারি যেখান থেকে আপনার মূল জমা আসেনি। এটি সর্বদা অতিরিক্ত নিরাপত্তা যাচাইয়ের সাপেক্ষে থাকবে।</p>
          <p>৮.৫. আপনি যদি তহবিল উত্তোলন করতে চান কিন্তু আপনার অ্যাকাউন্ট অপ্রবেশযোগ্য, সুপ্ত, লক করা বা বন্ধ থাকে, অনুগ্রহ করে আমাদের গ্রাহক সেবা বিভাগে যোগাযোগ করুন।</p>
          <p>৮.৬. যেসব ক্ষেত্রে আপনার ব্যালেন্স আপনার মোট জমার পরিমাণের অন্তত ১০ গুণ বড়, সেই ক্ষেত্রে আপনি মাসে উত্তোলনের জন্য € 5,000 (বা মুদ্রা সমতুল্য) এ সীমাবদ্ধ থাকবেন। অন্য ক্ষেত্রে প্রতি মাসে সর্বোচ্চ উত্তোলন পরিমাণ € 10,000।</p>
          <p>৮.৭. অনুগ্রহ করে মনে রাখবেন যে আপনি অনুচ্ছেদ ৩.৩ এবং ৪ এ উল্লিখিত সীমিত ব্যবহার নীতি লঙ্ঘন করলে আমরা উত্তোলন বা ফেরতের সফল প্রক্রিয়াকরণের নিশ্চয়তা দিতে পারি না।</p>
          
          <ol>
          <li><strong>পেমেন্ট লেনদেন ও প্রসেসর</strong></li>
          </ol>
          <p>৯.১. আমাদের কাছে প্রাপ্য সকল অর্থ পরিশোধের জন্য আপনি সম্পূর্ণরূপে দায়ী। আপনি অবশ্যই সরল বিশ্বাসে আমাদের সকল অর্থপ্রদান করবেন এবং কৃত কোনো অর্থপ্রদান বিপরীত করার চেষ্টা করবেন না বা বৈধভাবে সৃষ্ট দায় এড়াতে এমন কোনো পদক্ষেপ নেবেন না যা তৃতীয় পক্ষ দ্বারা সেই অর্থপ্রদান বিপরীত হতে পারে। আপনি যেকোনো চার্জ-ব্যাক, অর্থপ্রদানের প্রত্যাখ্যান বা বিপরীতকরণ এবং এর ফলে আমাদের হওয়া যেকোনো ক্ষতির জন্য আমাদের প্রতিদান দেবেন। আপনার করা প্রতি চার্জ-ব্যাক, অর্থপ্রদানের প্রত্যাখ্যান বা বিপরীতকরণের জন্য আমরা €50, বা মুদ্রা সমতুল্য একটি প্রশাসনিক ফি আরোপ করার অধিকারও সংরক্ষণ করি।</p>
          <p>৯.২. আপনার করা অর্থপ্রদান প্রক্রিয়া করতে আমরা তৃতীয়-পক্ষ ইলেকট্রনিক পেমেন্ট প্রসেসর এবং/অথবা মার্চেন্ট ব্যাংক ব্যবহার করার অধিকার সংরক্ষণ করি এবং আপনি তাদের শর্তাবলী মেনে চলতে সম্মত হন, শর্তসাপেক্ষে যে সেগুলো আপনাকে জানানো হয় এবং সেই শর্তগুলো এই শর্তাবলীর সাথে সাংঘর্ষিক নয়।</p>
          <p>৯.৩. মানি লন্ডারিং বা সন্ত্রাসে অর্থায়ন কার্যকলাপ প্রতিরোধে আমাদের সাইটে করা সকল লেনদেন যাচাই করা হতে পারে। সন্দেহজনক লেনদেন সংশ্লিষ্ট কর্তৃপক্ষের কাছে প্রতিবেদন করা হবে।</p>
          
          <ol>
          <li><strong>ত্রুটি</strong></li>
          </ol>
          <p>১০.১. আমাদের সিস্টেম বা প্রক্রিয়ায় ত্রুটি বা ত্রুটিপূর্ণ কার্যকারিতার ক্ষেত্রে, সকল বাজি অকার্যকর হয়ে যায়। সেবার কোনো ত্রুটি সম্পর্কে অবগত হওয়ার সাথে সাথেই আমাদের অবিলম্বে জানানো আপনার বাধ্যবাধকতা। সেবার সাথে সম্পর্কিত যোগাযোগ বা সিস্টেম ত্রুটি বা বাগ বা ভাইরাস ঘটলে এবং/অথবা সেবার কোনো ত্রুটি বা ভুলের ফলে আপনাকে করা অর্থপ্রদানের ক্ষেত্রে, এমন ত্রুটি থেকে উদ্ভূত বা ফলস্বরূপ কোনো প্রত্যক্ষ বা পরোক্ষ খরচ, ব্যয়, ক্ষতি বা দাবির জন্য আমরা আপনার বা কোনো তৃতীয় পক্ষের কাছে দায়ী থাকব না, এবং আমরা সংশ্লিষ্ট সকল গেম/বাজি অকার্যকর করার এবং এমন ত্রুটি সংশোধনে অন্য যেকোনো পদক্ষেপ নেওয়ার অধিকার সংরক্ষণ করি।</p>
          <p>১০.২. আমরা বুকমেকার লাইন পোস্ট করার ক্ষেত্রে যেন ত্রুটি না করি তা নিশ্চিত করতে সর্বাত্মক প্রচেষ্টা করি। তবে, মানবিক ত্রুটি বা সিস্টেম সমস্যার ফলে যদি এমন কোনো অডসে একটি বাজি গৃহীত হয় যা: বাজি ধরার সময় সাধারণ বাজারে উপলব্ধ অডস থেকে বস্তুগতভাবে ভিন্ন; অথবা বাজি ধরার সময় ঘটনাটি ঘটার সম্ভাবনার বিবেচনায় স্পষ্টভাবে ভুল, তবে আমরা সেই বাজি বাতিল বা অকার্যকর করার, অথবা কোনো ঘটনা শুরু হওয়ার পর ধরা একটি বাজি বাতিল বা অকার্যকর করার অধিকার সংরক্ষণ করি।</p>
          <p>১০.৩. আমাদের অধিকার রয়েছে আপনার কাছ থেকে অতিরিক্ত পরিশোধিত যেকোনো পরিমাণ পুনরুদ্ধার করার এবং যেকোনো ভুল সংশোধনে আপনার অ্যাকাউন্ট সমন্বয় করার। এমন ভুলের একটি উদাহরণ হতে পারে যেখানে একটি মূল্য ভুল অথবা যেখানে আমরা কোনো ঘটনার ফলাফল ভুলভাবে প্রবেশ করাই। আপনার অ্যাকাউন্টে পর্যাপ্ত তহবিল না থাকলে, আমরা কোনো ভুল বাজি সংক্রান্ত সংশ্লিষ্ট বকেয়া পরিমাণ আমাদের পরিশোধের দাবি করতে পারি। তদনুসারে, আমরা যেকোনো মুলতুবি খেলা বাতিল, হ্রাস বা মুছে ফেলার অধিকার সংরক্ষণ করি, তা ত্রুটির ফলে উদ্ভূত তহবিল দিয়ে ধরা হোক বা না হোক।</p>
          
          <ol>
          <li><strong>খেলার নিয়ম, ফেরত ও বাতিলকরণ</strong></li>
          </ol>
          <p>১১.১. কোনো ঘটনার বিজয়ী সেই ঘটনার নিষ্পত্তির তারিখে নির্ধারিত হবে, এবং বাজি ধরার উদ্দেশ্যে আমরা প্রতিবাদকৃত বা উল্টে দেওয়া সিদ্ধান্তকে স্বীকৃতি দেব না।</p>
          <p>১১.২. পোস্ট করা সকল ফলাফল ৭২ ঘণ্টা পর চূড়ান্ত হবে এবং সেই সময়ের পর কোনো প্রশ্ন গ্রহণ করা হবে না। ফলাফল পোস্ট করার ৭২ ঘণ্টার মধ্যে, আমরা কেবল মানবিক ত্রুটি, সিস্টেম ত্রুটি বা রেফারিং ফলাফল উৎসের করা ভুলের কারণে ফলাফল রিসেট/সংশোধন করব।</p>
          <p>১১.৩. পেআউট সময়ের মধ্যে ম্যাচের পরিচালনা সংস্থা কোনো কারণে ম্যাচের ফলাফল উল্টে দিলে সকল অর্থ ফেরত দেওয়া হবে।</p>
          <p>১১.৪. যেখানে ড্র অপশন প্রদান করা হয় এমন খেলায় ড্র হলে দল জেতা বা হারার সকল বাজি হারানো হবে। ড্র অপশন প্রদান না করা হলে ম্যাচে ড্রয়ের ফলাফলে সবাই ফেরত পাবে। এবং ড্র অপশন উপলব্ধ না করা হলে, অতিরিক্ত সময় গণনা করা হবে, যদি খেলা হয়।</p>
          <p>১১.৫. কোনো ফলাফল আমরা যাচাই করতে না পারলে, উদাহরণস্বরূপ যদি ঘটনাটি সম্প্রচারকারী ফিড বিঘ্নিত হয় (এবং অন্য কোনো উৎস দ্বারা যাচাই করা না যায়) তবে আমাদের সিদ্ধান্তে, সেই ঘটনার ওপর বাজিগুলো অকার্যকর বলে বিবেচিত হবে এবং বাজি ফেরত দেওয়া হবে।</p>
          <p>১১.৬. সকল ঘটনায় সর্বনিম্ন ও সর্বোচ্চ বাজির পরিমাণ আমরা নির্ধারণ করব এবং আগাম লিখিত নোটিশ ছাড়াই তা পরিবর্তনের সাপেক্ষে। আমরা পৃথক অ্যাকাউন্টের সীমাও সমন্বয় করার অধিকার সংরক্ষণ করি।</p>
          <p>১১.৭. গ্রাহকরা তাদের নিজস্ব অ্যাকাউন্ট লেনদেনের জন্য একান্তই দায়ী। একবার একটি লেনদেন সম্পূর্ণ হলে, তা পরিবর্তন করা যায় না। গ্রাহকের করা অনুপস্থিত বা নকল বাজির জন্য আমরা দায়িত্ব নিই না এবং একটি খেলা অনুপস্থিত বা নকল হওয়ার কারণে অসঙ্গতির অনুরোধ গ্রহণ করব না। গ্রাহকরা সকল অনুরোধকৃত বাজি গৃহীত হয়েছে তা নিশ্চিত করতে প্রতিটি সেশনের পর সাইটের My Account বিভাগে তাদের লেনদেন পর্যালোচনা করতে পারেন।</p>
          <p>১১.৮. যতক্ষণ দুটি দল সঠিক থাকে ততক্ষণ একটি ম্যাচআপ কার্যকর থাকবে, এবং আমাদের ওয়েবসাইটে এটি যে লিগ হেডারে স্থাপন করা হয়েছে তা নির্বিশেষে।</p>
          <p>১১.৯. eSport ম্যাচের জন্য ওয়েবসাইটে প্রদর্শিত শুরুর তারিখ ও সময় কেবল একটি ইঙ্গিত এবং সঠিক হওয়ার নিশ্চয়তা নেই। একটি ম্যাচ স্থগিত বা মুলতুবি হলে, এবং প্রকৃত নির্ধারিত শুরুর সময় থেকে ৭২ ঘণ্টার মধ্যে পুনরায় শুরু না হলে, ম্যাচটি কার্যকর হবে না এবং বাজি ফেরত দেওয়া হবে। ব্যতিক্রম হলো একটি দল/খেলোয়াড় টুর্নামেন্টে এগিয়ে যায় কিনা, বা টুর্নামেন্ট জেতে কিনা তার ওপর যেকোনো বাজি, যা একটি স্থগিত বা মুলতুবি ম্যাচ নির্বিশেষে কার্যকর থাকবে।</p>
          <p>১১.১০. আমরা কোনো ঘটনা ভুল তারিখসহ পোস্ট করলে, সকল বাজি পরিচালনা সংস্থার ঘোষিত তারিখের ভিত্তিতে কার্যকর হবে।</p>
          <p>১১.১১. একটি দল স্ট্যান্ড-ইন ব্যবহার করলে, ফলাফল এখনও বৈধ কারণ স্ট্যান্ড-ইন ব্যবহার করা ছিল দলের নিজস্ব পছন্দ।</p>
          <p>১১.১২. Company ওয়েবসাইট থেকে ঘটনা, বাজার এবং অন্য যেকোনো পণ্য সরিয়ে ফেলার অধিকার সংরক্ষণ করে।</p>
          <p>১১.১৩. আমাদের স্পোর্টস বেটিং নিয়মের বিস্তারিত ব্যাখ্যা পৃথক পৃষ্ঠায় রয়েছে: SPORTS BETTING RULES</p>
          
          <ol>
          <li><strong>যোগাযোগ ও নোটিশ</strong></li>
          </ol>
          <p>১২.১. এই শর্তাবলীর অধীনে আপনার কাছ থেকে আমাদের কাছে প্রদেয় সকল যোগাযোগ ও নোটিশ ওয়েবসাইটের একটি গ্রাহক সহায়তা ফরম ব্যবহার করে পাঠাতে হবে।</p>
          <p>১২.২. এই শর্তাবলীতে অন্যথায় নির্দিষ্ট না করা হলে, এই শর্তাবলীর অধীনে আমাদের কাছ থেকে আপনার কাছে প্রদেয় সকল যোগাযোগ ও নোটিশ হয় ওয়েবসাইটে পোস্ট করা হবে এবং/অথবা সংশ্লিষ্ট গ্রাহকের জন্য আমাদের সিস্টেমে থাকা Registered Email Address-এ পাঠানো হবে। এমন যোগাযোগের পদ্ধতি সম্পূর্ণরূপে আমাদের একক ও একচেটিয়া বিবেচনার অধীন।</p>
          <p>১২.৩. এই শর্তাবলীর অধীনে আপনি বা আমরা কর্তৃক প্রদেয় সকল যোগাযোগ ও নোটিশ ইংরেজি ভাষায় লিখিত হতে হবে এবং আপনার অ্যাকাউন্টের Registered Email Address থেকে ও এতে প্রদান করতে হবে।</p>
          <p>১২.৪. সময়ে সময়ে, আমরা আপনাকে বাজি সংক্রান্ত তথ্য, অনন্য প্রচারমূলক অফার এবং অফিসিয়াল চ্যানেল থেকে অন্যান্য তথ্য প্রদানের উদ্দেশ্যে ই-মেইলে যোগাযোগ করতে পারি। ওয়েবসাইটে নিবন্ধনের সময় এই শর্তাবলীতে সম্মত হলে আপনি এমন ই-মেইল গ্রহণে সম্মত হন। আপনি গ্রাহক সহায়তায় একটি অনুরোধ জমা দিয়ে যেকোনো সময় আমাদের কাছ থেকে এমন প্রচারমূলক অফার গ্রহণ থেকে অপ্ট আউট করতে বেছে নিতে পারেন।</p>
          
          <ol>
          <li><strong>আমাদের নিয়ন্ত্রণের বাইরের বিষয়</strong></li>
          </ol>
          <p>আমরা এমন কোনো ফোর্স মাজিওর ঘটনার কারণে সেবা প্রদানে ব্যর্থতা বা বিলম্বের জন্য দায়ী থাকতে পারি না যা যুক্তিসঙ্গতভাবে আমাদের নিয়ন্ত্রণের বাইরে বলে বিবেচিত হতে পারে, যেমন: প্রাকৃতিক দুর্যোগ; বাণিজ্য বা শ্রম বিরোধ; বিদ্যুৎ বিভ্রাট; কোনো সরকার বা কর্তৃপক্ষের কাজ, ব্যর্থতা বা বাদ পড়া; টেলিযোগাযোগ সেবার বাধা বা ব্যর্থতা; অথবা তৃতীয় পক্ষের কারণে যেকোনো বিলম্ব বা ব্যর্থতা — যুক্তিসঙ্গত প্রতিরোধমূলক ব্যবস্থা কার্যকর করা সত্ত্বেও, এবং এর ফলে আপনার হওয়া কোনো ক্ষতি বা ক্ষয়ের জন্য আমরা দায়ী থাকব না। এমন ক্ষেত্রে, আমরা কোনো দায় বহন না করে সেবা বাতিল বা স্থগিত করার অধিকার সংরক্ষণ করি।</p>
          
          <ol>
          <li><strong>দায়</strong></li>
          </ol>
          <p>১৪.১. প্রযোজ্য আইন দ্বারা অনুমোদিত পরিমাণে, এই শর্তাবলীর অধীনে আমাদের বাধ্যবাধকতা পালনে আমরা ব্যর্থ হলে আপনার হওয়া কোনো যুক্তিসঙ্গতভাবে পূর্বাভাসযোগ্য ক্ষতি বা ক্ষয়ের (প্রত্যক্ষ বা পরোক্ষ) জন্য আমরা আপনাকে ক্ষতিপূরণ দেব না, যদি না আমরা আইন দ্বারা আমাদের ওপর আরোপিত কোনো কর্তব্য লঙ্ঘন করি (আমাদের অবহেলায় মৃত্যু বা ব্যক্তিগত আঘাত ঘটালে তা সহ), যে ক্ষেত্রে সেই ব্যর্থতা নিম্নলিখিতের জন্য দায়ী হলে আমরা আপনার কাছে দায়ী থাকব না: (I) আপনার নিজের দোষ; (II) এই শর্তাবলী পালনের সাথে সংযোগহীন একটি তৃতীয় পক্ষ (উদাহরণস্বরূপ যোগাযোগ নেটওয়ার্কের কর্মক্ষমতা, যানজট, এবং সংযোগ বা আপনার কম্পিউটার সরঞ্জামের কর্মক্ষমতার কারণে সমস্যা); অথবা (III) অন্য যেকোনো ঘটনা যা আমরা বা আমাদের সরবরাহকারীরা যুক্তিসঙ্গত সতর্কতা অবলম্বন করলেও পূর্বাভাস বা প্রতিরোধ করতে পারতাম না। যেহেতু এই সেবা কেবল ভোক্তা ব্যবহারের জন্য তাই আমরা কোনো ধরনের ব্যবসায়িক ক্ষতির জন্য দায়ী থাকব না।</p>
          <p>১৪.২. এই শর্তাবলীর অধীনে কোনো ঘটনার জন্য আমরা দায়ী হলে, এই শর্তাবলীর অধীনে বা সাথে সম্পর্কিত আপনার কাছে আমাদের মোট সামগ্রিক দায় নিম্নলিখিতের বেশি হবে না (A) সংশ্লিষ্ট দায় সৃষ্টিকারী সংশ্লিষ্ট বাজি বা পণ্যের সাপেক্ষে আপনার অ্যাকাউন্টের মাধ্যমে ধরা বাজির মূল্য, অথবা (B) মোট EUR €500, যেটি কম।</p>
          <p>১৪.৩. আমরা দৃঢ়ভাবে সুপারিশ করি যে আপনি (I) ব্যবহারের আগে আপনার নিজের কম্পিউটার সরঞ্জামের সাথে সেবার উপযুক্ততা ও সামঞ্জস্য যাচাই করতে যত্ন নিন; এবং (II) অ্যান্টি-ভাইরাস সফটওয়্যার ইনস্টল করাসহ ক্ষতিকর প্রোগ্রাম বা ডিভাইস থেকে নিজেকে রক্ষা করতে যুক্তিসঙ্গত সতর্কতা অবলম্বন করুন।</p>
          
          <ol>
          <li><strong>অপ্রাপ্তবয়স্কদের দ্বারা জুয়া</strong></li>
          </ol>
          <p>১৫.১. আমরা যদি সন্দেহ করি বা নোটিশ পাই যে আপনি বর্তমানে ১৮ বছরের কম বা সেবার মাধ্যমে কোনো বাজি ধরার সময় ১৮ বছরের কম (অথবা আপনার ক্ষেত্রে প্রযোজ্য এখতিয়ারের আইনে নির্ধারিত সাবালকত্বের বয়সের নিচে) ছিলেন, তবে আপনি যাতে আর কোনো বাজি ধরতে বা আপনার অ্যাকাউন্ট থেকে কোনো উত্তোলন করতে না পারেন সেজন্য আপনার অ্যাকাউন্ট স্থগিত (লক) করা হবে। এরপর আমরা বিষয়টি তদন্ত করব, যার মধ্যে অন্তর্ভুক্ত আপনি ১৮ বছরের কম বয়সী কারও (অথবা আপনার ক্ষেত্রে প্রযোজ্য এখতিয়ারের আইনে নির্ধারিত সাবালকত্বের বয়সের নিচের কারও) এজেন্ট হিসেবে বা অন্যথায় তার পক্ষে বাজি ধরছিলেন কিনা। যদি দেখা যায় যে আপনি: (a) বর্তমানে; (b) সংশ্লিষ্ট সময়ে ১৮ বছরের কম বা আপনার ক্ষেত্রে প্রযোজ্য সাবালকত্বের বয়সের নিচে ছিলেন; অথবা (c) ১৮ বছরের কম বা প্রযোজ্য সাবালকত্বের বয়সের নিচের কারও এজেন্ট হিসেবে বা তার নির্দেশে বাজি ধরছিলেন: তবে বর্তমানে বা আপনার অ্যাকাউন্টে জমা হওয়ার কথা এমন সকল জয় আটকে রাখা হবে; অপ্রাপ্তবয়স্ক অবস্থায় সেবার মাধ্যমে বাজি ধরে অর্জিত সকল জয় চাহিবামাত্র আমাদের পরিশোধ করতে হবে (আপনি এই বিধান মেনে না চললে আমরা এমন অর্থ পুনরুদ্ধার সংক্রান্ত সকল খরচ পুনরুদ্ধারের চেষ্টা করব); এবং/অথবা আপনার অ্যাকাউন্টে জমা করা যে অর্থ জয় নয় তা আপনাকে ফেরত দেওয়া হবে অথবা আমাদের একক বিবেচনায় আপনার ১৮ বছর পূর্ণ হওয়া পর্যন্ত আটকে রাখা হবে। আমরা ফেরত দেওয়ার পরিমাণ থেকে পেমেন্ট লেনদেন ফি কেটে নেওয়ার অধিকার সংরক্ষণ করি, যার মধ্যে আপনার অ্যাকাউন্টে জমার জন্য আমরা যে লেনদেন ফি বহন করেছিলাম তা অন্তর্ভুক্ত।</p>
          <p>১৫.২. এই শর্ত আপনার ক্ষেত্রেও প্রযোজ্য যদি আপনার বয়স ১৮ বছরের বেশি হয় কিন্তু আপনি এমন একটি এখতিয়ারে বাজি ধরছেন যা বৈধ বাজির জন্য ১৮ বছরের চেয়ে বেশি বয়স নির্দিষ্ট করে এবং আপনি সেই এখতিয়ারে সেই বৈধ ন্যূনতম বয়সের নিচে থাকেন।</p>
          <p>১৫.৩. আমরা সন্দেহ করলে যে আপনি এই অনুচ্ছেদের বিধান লঙ্ঘন করছেন বা প্রতারণামূলক উদ্দেশ্যে সেগুলোর ওপর নির্ভর করার চেষ্টা করছেন, তবে আমরা বিষয়টি তদন্তে প্রয়োজনীয় যেকোনো পদক্ষেপ নেওয়ার অধিকার সংরক্ষণ করি, যার মধ্যে সংশ্লিষ্ট আইন প্রয়োগকারী সংস্থাকে অবহিত করা অন্তর্ভুক্ত।</p>
          
          <ol>
          <li><strong>প্রতারণা</strong></li>
          </ol>
          <p>প্রতারণা, অসততা বা অপরাধমূলক কাজে জড়িত যেকোনো গ্রাহকের বিরুদ্ধে আমরা ফৌজদারি ও চুক্তিগত শাস্তির চেষ্টা করব। এদের কোনোটি সন্দেহ হলে আমরা যেকোনো গ্রাহকের অর্থপ্রদান আটকে রাখব। গ্রাহকের প্রতারণা, অসততা বা অপরাধমূলক কাজ থেকে প্রত্যক্ষ বা পরোক্ষভাবে উদ্ভূত আমাদের হওয়া বা সৃষ্ট সকল খরচ, চার্জ বা ক্ষতি (কোনো প্রত্যক্ষ, পরোক্ষ বা পরিণামগত ক্ষতি, মুনাফার ক্ষতি, ব্যবসার ক্ষতি ও সুনামের ক্ষতিসহ) চাহিবামাত্র গ্রাহক আমাদের ক্ষতিপূরণ দেবেন ও পরিশোধ করতে দায়ী থাকবেন।</p>
          
          <ol>
          <li><strong>মেধাস্বত্ব</strong></li>
          </ol>
          <p>১৭.১. আমাদের নাম ও লোগোর যেকোনো অননুমোদিত ব্যবহারের ফলে আপনার বিরুদ্ধে আইনি ব্যবস্থা নেওয়া হতে পারে।</p>
          <p>১৭.২. আমাদের ও আপনার মধ্যে, সেবা, আমাদের প্রযুক্তি, সফটওয়্যার ও ব্যবসায়িক সিস্টেম (“Systems”) এবং আমাদের অডসের অধিকারের একমাত্র মালিক আমরা।<br>আপনি আপনার নিজস্ব বাণিজ্যিক লাভের জন্য আপনার ব্যক্তিগত প্রোফাইল ব্যবহার করবেন না (যেমন আপনার স্ট্যাটাস আপডেট কোনো বিজ্ঞাপনদাতার কাছে বিক্রি করা); এবং<br>আপনার অ্যাকাউন্টের জন্য একটি ডাকনাম নির্বাচন করার সময় উপযুক্ত মনে করলে আমরা তা সরিয়ে বা পুনরুদ্ধার করার অধিকার সংরক্ষণ করি।</p>
          <p>১৭.৩. আপনি আমাদের নয় এমন কোনো পণ্য বা সেবার সাথে সংযোগে আমাদের URL, ট্রেডমার্ক, ট্রেড নাম এবং/অথবা ট্রেড ড্রেস, লোগো (“Marks”) এবং/অথবা আমাদের অডস ব্যবহার করবেন না, যা কোনোভাবে গ্রাহক বা জনসাধারণের মধ্যে বিভ্রান্তি সৃষ্টি করতে পারে অথবা কোনোভাবে আমাদের হেয় করে।</p>
          <p>১৭.৪. এই শর্তাবলীতে স্পষ্টভাবে উল্লিখিত ব্যতীত, আমরা ও আমাদের লাইসেন্সদাতারা আপনাকে Systems বা Marks-এ কোনো স্পষ্ট বা অন্তর্নিহিত অধিকার, লাইসেন্স, স্বত্ব বা স্বার্থ প্রদান করি না এবং এমন সকল অধিকার, লাইসেন্স, স্বত্ব ও স্বার্থ বিশেষভাবে আমাদের ও আমাদের লাইসেন্সদাতাদের দ্বারা সংরক্ষিত। আপনি সেবার মধ্যে ওয়েব পৃষ্ঠা বা কনটেন্ট পর্যবেক্ষণ বা অনুলিপি করতে কোনো স্বয়ংক্রিয় বা ম্যানুয়াল ডিভাইস ব্যবহার না করতে সম্মত হন। কোনো অননুমোদিত ব্যবহার বা পুনরুৎপাদনের ফলে আপনার বিরুদ্ধে আইনি ব্যবস্থা নেওয়া হতে পারে।</p>
          
          <ol>
          <li><strong>আপনার লাইসেন্স</strong></li>
          </ol>
          <p>১৮.১. এই শর্তাবলী এবং আপনার তা মেনে চলা সাপেক্ষে, আমরা আপনাকে কেবল আপনার ব্যক্তিগত অ-বাণিজ্যিক উদ্দেশ্যে সেবায় প্রবেশ ও ব্যবহারের একটি অ-একচেটিয়া, সীমিত, অ-হস্তান্তরযোগ্য ও অ-সাব-লাইসেন্সযোগ্য লাইসেন্স প্রদান করি। এই শর্তাবলীর অধীনে আপনার সাথে আমাদের চুক্তি শেষ হলে আপনাকে দেওয়া আমাদের লাইসেন্সও শেষ হয়।</p>
          <p>১৮.২. আপনার নিজস্ব কনটেন্টের ক্ষেত্রে ব্যতীত, এই শর্তাবলীতে বা ওয়েবসাইটে অন্যথায় আমরা যা স্পষ্টভাবে অনুমতি দিই তা ছাড়া আপনি কোনো পরিস্থিতিতেই সেবা এবং/অথবা এর কোনো কনটেন্ট বা এতে থাকা সফটওয়্যার সংশোধন, প্রকাশ, প্রেরণ, হস্তান্তর, বিক্রি, পুনরুৎপাদন, আপলোড, পোস্ট, বিতরণ, সম্পাদন, প্রদর্শন, এর থেকে ডেরিভেটিভ কাজ তৈরি বা অন্য কোনোভাবে শোষণ করতে পারবেন না। সেবার কোনো তথ্য বা কনটেন্ট বা সেবার সাথে সম্পর্কিত আপনাকে উপলব্ধ করা কোনো তথ্য সংশোধন বা পরিবর্তন, অন্য ডেটার সাথে একীভূত বা যেকোনো আকারে প্রকাশ করা যাবে না, যার মধ্যে উদাহরণস্বরূপ স্ক্রিন বা ডেটাবেস স্ক্র্যাপিং এবং এমন তথ্য বা কনটেন্ট সংগ্রহ, সংরক্ষণ, পুনর্গঠন বা কারসাজি করার উদ্দেশ্যে অন্য যেকোনো কার্যকলাপ অন্তর্ভুক্ত।</p>
          <p>১৮.৩. এই অনুচ্ছেদ আপনার দ্বারা কোনো অমান্য আমাদের বা তৃতীয় পক্ষের মেধাস্বত্ব ও অন্যান্য মালিকানা অধিকারেরও লঙ্ঘন হতে পারে যা আপনাকে দেওয়ানি দায় এবং/অথবা ফৌজদারি বিচারের সম্মুখীন করতে পারে।</p>
          
          <ol>
          <li><strong>আপনার আচরণ ও নিরাপত্তা</strong></li>
          </ol>
          <p>১৯.১. আপনার এবং আমাদের সকল গ্রাহকের সুরক্ষার জন্য, সেবায় কোনো কনটেন্ট পোস্ট করা, সেইসাথে এর সাথে এবং/অথবা সেবার সাথে সম্পর্কিত এমন আচরণ যা কোনোভাবে বেআইনি, অনুপযুক্ত বা অবাঞ্ছিত তা কঠোরভাবে নিষিদ্ধ (“Prohibited Behaviour”)।</p>
          <p>১৯.২. আপনি Prohibited Behaviour-এ জড়িত হলে, অথবা আমরা আমাদের একক বিবেচনায় নির্ধারণ করলে যে আপনি Prohibited Behaviour-এ জড়িত, তবে আপনাকে নোটিশ ছাড়াই আপনার অ্যাকাউন্ট এবং/অথবা সেবায় আপনার প্রবেশ বা ব্যবহার অবিলম্বে বন্ধ করা হতে পারে। Prohibited Behaviour-এ জড়িত থাকার ক্ষেত্রে অন্য কোনো গ্রাহক, অন্য তৃতীয় পক্ষ, প্রয়োগকারী কর্তৃপক্ষ এবং/অথবা আমরা আপনার বিরুদ্ধে আইনি ব্যবস্থা নিতে পারি।</p>
          <p>১৯.৩. Prohibited Behaviour-এর মধ্যে অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয়, নিম্নলিখিত উদ্দেশ্যে সেবায় প্রবেশ বা ব্যবহার: আপনি জানেন এমন মিথ্যা, বিভ্রান্তিকর বা বেআইনি তথ্য প্রচার বা শেয়ার করা; কোনো বেআইনি বা অবৈধ কার্যকলাপ পরিচালনা করা, যেমন অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয় এমন কোনো কার্যকলাপ যা কোনো অপরাধমূলক কার্যকলাপ বা উদ্যোগকে এগিয়ে নেয় বা প্রচার করে, অন্য গ্রাহকের বা অন্য কোনো তৃতীয় পক্ষের গোপনীয়তা বা অন্যান্য অধিকার লঙ্ঘন করে অথবা কম্পিউটার ভাইরাস তৈরি বা ছড়ায়; কোনোভাবে অপ্রাপ্তবয়স্কদের ক্ষতি করা; বেআইনি, ক্ষতিকর, হুমকিমূলক, অপমানজনক, নির্যাতনমূলক, মানহানিকর, অশ্লীল, কুরুচিপূর্ণ, সহিংস, ঘৃণাপূর্ণ, অথবা জাতিগত বা নৃতাত্ত্বিক বা অন্যথায় আপত্তিকর কোনো কনটেন্ট প্রেরণ বা উপলব্ধ করা; ব্যবহারকারীর কোনো আইন বা চুক্তিগত বা ফিডুশিয়ারি সম্পর্কের অধীনে উপলব্ধ করার অধিকার নেই এমন কোনো কনটেন্ট প্রেরণ বা উপলব্ধ করা, যার মধ্যে সীমাবদ্ধতা ছাড়াই তৃতীয় পক্ষের কপিরাইট, ট্রেডমার্ক বা অন্যান্য মেধাস্বত্ব ও মালিকানা অধিকার লঙ্ঘনকারী যেকোনো কনটেন্ট অন্তর্ভুক্ত; সেবার কার্যকারিতা, এর উপস্থাপনা বা অন্য কোনো ওয়েবসাইট, কম্পিউটার সফটওয়্যার বা হার্ডওয়্যার বিঘ্নিত, ধ্বংস বা পরিবর্তন করার জন্য ডিজাইন করা কোনো সফটওয়্যার ভাইরাস বা অন্য কম্পিউটার বা প্রোগ্রামিং কোড (HTML সহ) ধারণকারী কোনো কনটেন্ট বা উপাদান প্রেরণ বা উপলব্ধ করা; আমাদের ব্যবহৃত যোগাযোগ প্রোটোকল আটকানো, অনুকরণ বা পুনর্নির্দেশ করা, সেবা পরিবর্তনের জন্য ডিজাইন করা চিট, মড বা হ্যাক বা অন্য কোনো সফটওয়্যার তৈরি বা ব্যবহার করা, অথবা সেবা থেকে বা এর মাধ্যমে তথ্য আটকায় বা সংগ্রহ করে এমন কোনো সফটওয়্যার ব্যবহারসহ, কোনোভাবে সেবায় হস্তক্ষেপ, বিঘ্নিত বা রিভার্স ইঞ্জিনিয়ার করা; কোনো রোবট, স্পাইডার বা অন্য স্বয়ংক্রিয় ব্যবস্থা ব্যবহার করে সেবা থেকে কোনো তথ্য পুনরুদ্ধার বা সূচীবদ্ধ করা; আমাদের একক ও সম্পূর্ণ অবাধ বিবেচনায় এমন কোনো কার্যকলাপ বা পদক্ষেপে অংশগ্রহণ করা যার ফলে অন্য কোনো গ্রাহক প্রতারিত বা প্রতারণার শিকার হয় বা হতে পারে;<br>অন্তর্ভুক্ত কিন্তু সীমাবদ্ধ নয় জাঙ্ক মেইল, ইনস্ট্যান্ট মেসেজিং, “spim”, “spam”, চেইন লেটার, পিরামিড স্কিম বা অন্যান্য ধরনের প্ররোচনার মতো কোনো অযাচিত বা অননুমোদিত বিজ্ঞাপন বা গণ মেইলিং প্রেরণ বা উপলব্ধ করা; স্বয়ংক্রিয় উপায়ে বা মিথ্যা বা প্রতারণামূলক অজুহাতে ওয়েবসাইটে অ্যাকাউন্ট তৈরি করা; অন্য গ্রাহক বা অন্য কোনো তৃতীয় পক্ষের ছদ্মবেশ ধারণ করা, অথবা এমন অন্য কোনো কাজ যা আমরা যুক্তিসঙ্গতভাবে আমাদের ব্যবসায়িক নীতির পরিপন্থী বলে বিবেচনা করি।</p>
          <p>উপরের Prohibited Behaviour-এর তালিকা সম্পূর্ণ নয় এবং যেকোনো সময় বা সময়ে সময়ে আমাদের দ্বারা সংশোধিত হতে পারে। আমরা তদন্ত করার এবং পরিস্থিতিতে আমরা আমাদের একক বিবেচনায় উপযুক্ত বা প্রয়োজনীয় মনে করি এমন সকল পদক্ষেপ নেওয়ার অধিকার সংরক্ষণ করি, যার মধ্যে সীমাবদ্ধতা ছাড়াই সেবা থেকে গ্রাহকের পোস্ট(সমূহ) মুছে ফেলা এবং/অথবা তাদের অ্যাকাউন্ট বন্ধ করা অন্তর্ভুক্ত, এবং এমন যেকোনো গ্রাহক বা তৃতীয় পক্ষের বিরুদ্ধে ব্যবস্থা নেওয়া যারা প্রত্যক্ষ বা পরোক্ষভাবে Prohibited Behaviour-এ জড়িত, অথবা জেনেশুনে কোনো তৃতীয় পক্ষকে প্রত্যক্ষ বা পরোক্ষভাবে Prohibited Behaviour-এ জড়িত হতে অনুমতি দেয়, এমন গ্রাহক বা তৃতীয় পক্ষকে নোটিশসহ বা নোটিশ ছাড়া।</p>
          
          <ol>
          <li><strong>অন্যান্য ওয়েবসাইটের লিঙ্ক</strong></li>
          </ol>
          <p>সেবায় এমন তৃতীয়-পক্ষ ওয়েবসাইটের লিঙ্ক থাকতে পারে যা আমাদের দ্বারা রক্ষণাবেক্ষণ করা হয় না বা আমাদের সাথে সম্পর্কিত নয়, এবং যার ওপর আমাদের কোনো নিয়ন্ত্রণ নেই। এমন ওয়েবসাইটের লিঙ্ক কেবল গ্রাহকদের সুবিধার্থে প্রদান করা হয়, এবং আমাদের দ্বারা নির্ভুলতা বা সম্পূর্ণতার জন্য কোনোভাবেই তদন্ত, পর্যবেক্ষণ বা যাচাই করা হয় না। এমন ওয়েবসাইটের লিঙ্ক লিঙ্ককৃত ওয়েবসাইট বা তাদের কনটেন্ট বা তাদের মালিক(দের) সম্পর্কে আমাদের কোনো অনুমোদন এবং/অথবা কোনো সংযুক্তি বোঝায় না। তাদের উপলব্ধতা বা তাদের নির্ভুলতা, সম্পূর্ণতা, প্রবেশযোগ্যতা ও উপযোগিতার ওপর আমাদের কোনো নিয়ন্ত্রণ বা দায়িত্ব নেই। তদনুসারে এমন ওয়েবসাইটে প্রবেশ করার সময় আমরা সুপারিশ করি যে একটি নতুন ওয়েবসাইট পরিদর্শনের সময় আপনি স্বাভাবিক সতর্কতা অবলম্বন করবেন, যার মধ্যে তাদের গোপনীয়তা নীতি ও ব্যবহারের শর্তাবলী পর্যালোচনা করা অন্তর্ভুক্ত।</p>
          
          <ol>
          <li><strong>অভিযোগ</strong></li>
          </ol>
          <p>২১.১. এই শর্তাবলী সম্পর্কে আপনার কোনো উদ্বেগ বা প্রশ্ন থাকলে আপনি ওয়েবসাইটের লিঙ্কের মাধ্যমে আমাদের গ্রাহক সেবা বিভাগে যোগাযোগ করবেন এবং আমাদের সাথে সকল যোগাযোগে আপনার Registered Email Address ব্যবহার করবেন।</p>
          <p>২১.২. পূর্বোক্ত সত্ত্বেও, আমরা যে কোনো অভিযোগ পেয়েছি বা এর সাথে সম্পর্কিত ব্যবস্থা নিয়েছি তার প্রতিক্রিয়া জানানোর ক্ষেত্রে আপনার বা কোনো তৃতীয় পক্ষের কাছে আমরা কোনো দায় গ্রহণ করি না।</p>
          <p>২১.৩. কোনো গ্রাহক একটি বাজি কীভাবে নিষ্পত্তি হয়েছে তাতে সন্তুষ্ট না হলে গ্রাহক তাদের অভিযোগের বিবরণ আমাদের গ্রাহক সেবা বিভাগে প্রদান করবেন। আমরা এই ধরনের প্রশ্নের কয়েক দিনের মধ্যে (এবং যেকোনো ক্ষেত্রে গ্রহণের ২৮ দিনের মধ্যে এমন সকল প্রশ্নের উত্তর দেওয়ার অভিপ্রায় রাখি) সাড়া দিতে আমাদের যুক্তিসঙ্গত প্রচেষ্টা ব্যবহার করব।</p>
          <p>২১.৪. সংশ্লিষ্ট বাজি নিষ্পত্তির তারিখ থেকে তিন (৩) দিনের মধ্যে বিরোধ দাখিল করতে হবে। এই সময়ের পর কোনো দাবি সম্মানিত হবে না। গ্রাহক তাদের অ্যাকাউন্ট লেনদেনের জন্য একান্তই দায়ী।</p>
          <p>২১.৫. আপনার ও আমাদের মধ্যে বিরোধ দেখা দিলে আমাদের গ্রাহক সেবা বিভাগ একটি সম্মত সমাধানে পৌঁছাতে চেষ্টা করবে। আমাদের গ্রাহক সেবা বিভাগ আপনার সাথে একটি সম্মত সমাধানে পৌঁছাতে অক্ষম হলে, বিষয়টি আমাদের ব্যবস্থাপনার কাছে উত্থাপন করা হবে।</p>
          <p>২১.৬. গ্রাহকের সন্তুষ্টির জন্য একটি বিরোধ সমাধানের সকল প্রচেষ্টা ব্যর্থ হলে, গ্রাহকের সালিসের মাধ্যমে বিরোধ নিষ্পত্তির অধিকার রয়েছে।</p>
          
          <ol>
          <li><strong>অর্পণ</strong></li>
          </ol>
          <p>এই শর্তাবলী বা এর অধীনে কোনো অধিকার বা বাধ্যবাধকতা আমাদের পূর্ব লিখিত সম্মতি ছাড়া আপনি অর্পণ করতে পারবেন না, যে সম্মতি অযৌক্তিকভাবে আটকে রাখা হবে না। আমরা, আপনার সম্মতি ছাড়াই, এর অধীনে আমাদের অধিকার ও বাধ্যবাধকতার সম্পূর্ণ বা যেকোনো অংশ যেকোনো তৃতীয় পক্ষের কাছে অর্পণ করতে পারি, শর্তসাপেক্ষে যে এমন তৃতীয় পক্ষ সেবার মূলত অনুরূপ মানের একটি সেবা প্রদানে সক্ষম, সেবায় এই মর্মে লিখিত নোটিশ পোস্ট করে।</p>
          
          <ol>
          <li><strong>বিভাজ্যতা</strong></li>
          </ol>
          <p>এই শর্তাবলীর কোনো বিধান কোনো উপযুক্ত কর্তৃপক্ষ কর্তৃক অকার্যকর বা অবৈধ বলে বিবেচিত হলে, সংশ্লিষ্ট বিধানটি প্রযোজ্য আইন দ্বারা অনুমোদিত সর্বাধিক পরিমাণে মূল লেখার অভিপ্রায় অনুসারে প্রয়োগযোগ্য করার জন্য সংশোধন করা হবে। এই শর্তাবলীর অবশিষ্ট বিধানের বৈধতা ও প্রয়োগযোগ্যতা প্রভাবিত হবে না।</p>
          
          <ol>
          <li><strong>এই শর্তাবলীর লঙ্ঘন</strong></li>
          </ol>
          <p>আমাদের অন্যান্য প্রতিকার সীমিত না করে, আমাদের যুক্তিসঙ্গত মতামতে আপনি এই শর্তাবলীর কোনো গুরুত্বপূর্ণ শর্ত লঙ্ঘন করলে, উভয় ক্ষেত্রেই আপনাকে আগাম নোটিশ না দিয়ে আমরা আপনার অ্যাকাউন্ট স্থগিত বা বন্ধ করতে পারি এবং আপনাকে সেবা প্রদান অব্যাহত রাখতে অস্বীকৃতি জানাতে পারি। তবে, নেওয়া এমন যেকোনো পদক্ষেপের নোটিশ আপনাকে অবিলম্বে প্রদান করা হবে।</p>
          
          <ol>
          <li><strong>সাধারণ বিধান</strong></li>
          </ol>
          <p>২৫.১. চুক্তির মেয়াদ। আপনি সেবায় প্রবেশ বা ব্যবহার করা কালীন অথবা ওয়েবসাইটের গ্রাহক বা দর্শনার্থী থাকা কালীন এই শর্তাবলী পূর্ণ বলবৎ ও কার্যকর থাকবে। যেকোনো কারণে আপনার অ্যাকাউন্ট বন্ধ হওয়ার পরও এই শর্তাবলী বহাল থাকবে।</p>
          <p>২৫.২. লিঙ্গ। একবচন সংখ্যা নির্দেশক শব্দ বহুবচন অন্তর্ভুক্ত করবে ও বিপরীতক্রমে, পুংলিঙ্গ নির্দেশক শব্দ স্ত্রীলিঙ্গ ও ক্লীবলিঙ্গ অন্তর্ভুক্ত করবে ও বিপরীতক্রমে এবং ব্যক্তি নির্দেশক শব্দ ব্যক্তি, অংশীদারিত্ব, সমিতি, ট্রাস্ট, অনিগমিত সংগঠন ও কর্পোরেশন অন্তর্ভুক্ত করবে।</p>
          <p>২৫.৩. অব্যাহতি। আচরণে হোক বা অন্যথায়, আপনার দ্বারা এই শর্তাবলীর কোনো শর্তের লঙ্ঘন বা হুমকিপ্রাপ্ত লঙ্ঘনের ক্ষেত্রে আমাদের কোনো অব্যাহতি আমাদের বিরুদ্ধে কার্যকর বা বাধ্যকর হবে না যদি না তা লিখিতভাবে করা হয় ও আমাদের দ্বারা যথাযথভাবে স্বাক্ষরিত হয়, এবং লিখিত অব্যাহতিতে অন্যথায় নির্ধারিত না হলে, তা অব্যাহতিপ্রাপ্ত নির্দিষ্ট লঙ্ঘনে সীমাবদ্ধ থাকবে। আমাদের দ্বারা যেকোনো সময়ে এই শর্তাবলীর কোনো শর্ত প্রয়োগে ব্যর্থতা সেই বিধানের অব্যাহতি বা অন্য যেকোনো সময়ে সেই বিধান প্রয়োগে আমাদের অধিকারের অব্যাহতি হিসেবে ব্যাখ্যা করা হবে না।</p>
          <p>২৫.৪. স্বীকৃতি। এরপর সেবায় প্রবেশ বা ব্যবহার করে, আপনি এই শর্তাবলীর প্রতিটি অনুচ্ছেদ পড়েছেন, বুঝেছেন ও সম্মত হয়েছেন বলে স্বীকার করেন। ফলস্বরূপ, আপনি এতদ্বারা এই শর্তাবলীতে থাকা কোনো কিছুর বিপরীতে ভবিষ্যৎ কোনো যুক্তি, দাবি, চাহিদা বা কার্যক্রম অপরিবর্তনীয়ভাবে পরিত্যাগ করেন।</p>
          <p>২৫.৫. ভাষা। এই নিয়মের ইংরেজি ভাষা সংস্করণ ও অন্য কোনো ভাষা সংস্করণের মধ্যে অসঙ্গতি থাকলে, ইংরেজি ভাষা সংস্করণটি সঠিক বলে বিবেচিত হবে।</p>
          <p>২৫.৬. প্রযোজ্য আইন। এই শর্তাবলী একচেটিয়াভাবে Union of Comoros-এর Anjouan রাজ্যে বলবৎ আইন দ্বারা পরিচালিত।</p>
          <p>২৫.৭. সম্পূর্ণ চুক্তি। এই শর্তাবলী সেবায় আপনার প্রবেশ ও ব্যবহারের ক্ষেত্রে আপনি ও আমাদের মধ্যে সম্পূর্ণ চুক্তি গঠন করে, এবং এর বিষয়বস্তুর ক্ষেত্রে মৌখিক বা লিখিত সকল পূর্ববর্তী চুক্তি ও যোগাযোগ প্রতিস্থাপন করে।</p>
        
`;

  return (
    <PublicLayout>
      <article className="content-page">
        <h1>{locale === 'bn' ? 'শর্তাবলী' : 'Terms and Conditions'}</h1>
        <div dangerouslySetInnerHTML={{ __html: locale === 'bn' ? bodyBn : bodyEn }} />
      </article>
    </PublicLayout>
  );
}
