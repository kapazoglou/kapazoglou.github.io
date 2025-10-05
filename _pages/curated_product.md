---
title: " "
permalink: "/curated_product.html"
image: "/assets/images/hero.jpg"
---

# A curated selection of projects

* [Design Process with Examples](#design-process-with-examples)
* [Better Content Delivery for Measurable Outcomes](#better-content-delivery-for-measurable-outcomes)
* [Reducing Friction in User Acquisition](#reducing-friction-in-user-acquisition)
* [Improving Retention through Medical Adherence](#improving-retention-through-medical-adherence)
* [Design Systems](#design-systems)
* [Implementing New Processes](#implementing-new-processes)

> *Please allow a few seconds for each embedded Figma project to load. I am aware it is not the optimal user experience but I also find it to be a straightforward way to share Figma files. You can view them in full-screen by clicking the button on the top-right of each frame. 
Thank you for your patience*  :)

<br>

## Design Process with Examples

The following Design Process I developed in collaboration with the Product Manager at Mika Health. The app was focused on providing information and support to cancer patients throughout their patient journey. 
I implemented a step by step pipeline with multiple stakeholder touchpoints and clear transitions from each step to the next.

> Through the implementation of the Design Process I managed to:
> * improve inter-departmental communication
> * establish clear accountability
> * get timely and explicit stakeholder buy-in
> * smoothly fit within Tech processes such as Sprints
> * Keep well documented decisions on each step that facilitate auditing processes

<br>

##### 1. Opportunity/Problem Definition & Research
Upon receiving a brief I check to see that I have all the relevant information, then note the stakeholders to loop in and clearly define the limits of the scope with them and the PM in order to avoid scope creep. The PM and I look for opportunities to minimise and combine the project with backlog issues or anything reducing tech debt. The project is then allocated a time estimate and a priority in the roadmap.

After that I start research and ideation looking at:
* best practices on Mobbin and in-house competitor analysis
* AI suggestions i.e. Stitch
* the User Journey and relevant Personas
* collated reports from in-House User Research & Behavioural Science

> ##### Example: Treatment Plan Best Practice Analysis
> *For the purposes of a partnership as well as a grant we were required to track user adherence to medication administered both at home and at clinics. In order to do that we first had to lay a framework for users to add and track their medication and medical appointments in-app. This was prioritised as it was also an often requested feature from our users. By researching apps like Jasper the backend complexity of the project became apparent.*
>
> <iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/HX3mj9ddgNqlu3wOlYc6Ld/%F0%9F%94%97-Treatment-Plan-Best-Practice-Analysis?node-id=4038-83822&embed-host=share" allowfullscreen></iframe>

<br>

##### 2. Flow diagram
Once all the information is in place the next step is to generate a flow diagram and get it in front of the stakeholders as rapidly as possible. With this diagram as a talking point I can:
* establish feedback loops
* get stakeholder buy-in
* check with backend for feasibility & briefing them on requirements 
* align with the content team 
* perform high level user testing if necessary

The process is iterated, feedback is incorporated and documented as required.

> ##### Example: Treatment Plan Diagram
> *Because of the scope of this feature, or rather feature collection, I designed a high level diagram along with a more in-depth object diagram in order to refine requirements with backend. This step saved us a lot of time since a lot of the ambiguities were expressely discussed and resolved. It also gave a good headstart to backend so that when the final designs were ready, frontend would be able to use the APIs right away.*
>
> <iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/4W5mpXGi4lT1gpFiJd5k10/%F0%9F%94%97-Treatment-Plan-Diagrams?node-id=1-17403&embed-host=share" allowfullscreen></iframe>

<br>

#### 3. Wireframes
Once the diagram has been agreed, the flow is then fleshed out more into wireframes where navigation and interactions start to be defined. By presenting the Wireframes I collect: 
* further stakeholder buy-in. 
* frontend comment for feasibility and agreement on Design System components and interaction patterns to be used
* QA & frontend comment on error handling and exceptions
* user feedback through user testing with clickdummies

The process is iterated, feedback is incorporated and documented as required.

> ##### Example: Treatment Plan Wireframes
> *The diagram helped me to assess usability pitfalls early on since it required a lot of user data input. I ironed those out by making wireframes which I user tested with click dummy prototypes. At this step it became obvious that the feature would be too big to release in one go persuaded the stakeholders to release the feature incrementally. I created an MVP version as well as a series of functionality extensions to be planned in a series of upcoming releases.*
>
> <iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/p5jXXfAPMNSAZmGhhuWwXw/%F0%9F%94%97-Treatment-Plan-Wireframes?node-id=4003-11949&embed-host=share" allowfullscreen></iframe>


<br>

##### 4. Screen design
Once there is enough feedback incorporated into the wireframes, the screen design process can start where design system components, templates and interaction patterns are applied. These screens are then taken to refinement so that:

* we can run final user testing with full prototypes
* QA, Front- & Backend are briefed as to the requirements
* s development plan can start being formed
* work packages can be agreed upon with specified start dates/Sprints 

The process is iterated, feedback is incorporated and documented as required.

> ##### Example: Treatment Plan Screen Design
> *At the wireframe stage I decided that the feature could be split between the at-home and clinic administration of medication. I started by designing the MVP screens using only using pre-existing Design System components and leaving any improvements for upcoming feature extensions. We tested the MVP to ensure that it had retained user value. Splitting the project helped us avoid a huge development bottleneck and bought us time while meeting the requirements of our partnership.*
> <iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/W28UGT8CPwbK3pdXhDMV3k/%F0%9F%94%97-Treatment-Plan-Screens?node-id=1-17403&embed-host=share" allowfullscreen></iframe>

<br>

##### 5. Handover readiness
Once the screens are approved, the project is checked against the Definition of Readiness for the Design team and prepared for handover. At this step I ensure that: 

* screens exist for both iOS & Android behaviours
* Design System components are checked, updated or incorporated as necessary
* section and frame names, localisation keys and tokens are consistent
* behaviour annotation is added as necessary

After this the screens with their comments are marked as Ready for Development together with all the annotations and attached to the relevant Tech tickets.

<br>

[go back to top](#a-curated-selection-of-projects)

<br>

---

<br>

## Reducing Friction in User Acquisition

Mika Health operated within a strict regulatory framework, requiring adherence to multiple standards, including DiGA, MDR, GDPR, CCPA, HIPAA, and ePA. This meant that every design and development decision had to align with legal requirements to protect patient data, ensure accessibility, and meet market approval standards.

<br>

<iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/X0ZgrfqI35FSQFjSucUyjs/%F0%9F%94%97-Onboarding?node-id=4001-46385&embed-host=share" allowfullscreen></iframe>

<br>

DiGA registration added complex onboarding that increased friction during activation; while these measures ensured compliance, they hampered user adoption, so after the business strategy moved away from DiGA the onboarding was completely overhauled to remove barriers, streamline access, boost acquisition, and deliver a user-centered redesign with smoother, more intuitive entry points.

<br>

<iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/X0ZgrfqI35FSQFjSucUyjs/%F0%9F%94%97-Onboarding?node-id=4001-46681&embed-host=share" allowfullscreen></iframe>

<br>

I partnered with marketing to align messaging, user expectations, and brand positioning so acquisition funnels were optimized and the app became more accessible to a broader audience; the redesigned onboarding improved conversion rates, reduced drop-offs, and created a more intuitive entry point, demonstrating my ability to balance regulatory compliance with usability while driving strategic, scalable growth in a complex healthcare environment.

<br>

[go back to top](#a-curated-selection-of-projects)

<br>

---

<br>

## Better Content Delivery for Measurable Outcomes

Mika Health was conducting a clinical study into Behavioural Change Techniques (BCTs) where it was required to be able to perform AB tests between different techniques for different patients in a way that created measurable outcomes. This project was also addressing several user wishes for closer personalisation to their needs.

<br>

<iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/1SwD7u5Mi3GX01KsSlSvRF/%F0%9F%94%97-Distress-Management?node-id=1-17403&embed-host=share" allowfullscreen></iframe>

<br>

In collaboration with the in-house Behavioural Scientist I translated the BCTs into modular flows that could be turned on and off in order to enable a variety of AB testing. Furthermore, the project began adressing pre-existing issues with content delivery and was seeking to increase retention by ensuring patients received the content they needed at the time they needed it in. The MVP was released as a Distress Management feature which improved retention and met our partnership responsibilities.

<br>

[go back to top](#a-curated-selection-of-projects)

<br>

---

<br>

## Improving Retention through Medical Adherence
Stepping into a Lead role, I leveraged two years of hands-on UX work to address structural issues. I conducted extensive user research to surface patient motivations and frustrations and collaborated with a behavioural psychologist to select Behavioural Change Techniques that support healthier routines; I mapped the app flow, removed duplicate entry points, dead ends, and misdirected paths, redesigned the experience into a cohesive, purposeful loop, and introduced progression and personalization techniques to sustain motivation and make the app feel increasingly tailored and rewarding.

<br>

<iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/1N5pVskSwQNYdU1aQlZN7y/Project-Selection?node-id=10-6593&embed-host=share" allowfullscreen></iframe>

<br>

I designed a user-centered main app flow tied to the recommended therapy progress, with clear actionable steps; to prevent overwhelm I implemented gentle notifications, surfaced relevant personalized recommendations, and added reward mechanisms that visually represented completed actions as progress, while weekly insights were structured to reveal meaningful patterns over time. The wireframes tested well with users and an MVP was commissioned.

<br>

[go back to top](#a-curated-selection-of-projects)

<br>

---

<br>

## Design Systems

Before implementing the design system, the healthcare application faced several challenges. There was no centralized design system, leading to inconsistencies in user interface and experience. Developers lacked a single source of truth, which often resulted in discrepancies between design and implementation. 

Additionally, design elements were disconnected across different platforms, creating a fragmented experience. Documentation was incomplete, making it difficult to track various use cases, variants, and error states. As a result, technical debt increased, slowing down development. Moreover, there was no framework for scaling or localizing the product, which limited its growth potential.

<br>

<iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/VBnScDLbMBmHqbmeKMJsXa/%F0%9F%94%97Design-System?node-id=2-54414&embed-host=share" allowfullscreen></iframe>

<br>

To address these issues, I was tasked with creating a branded look and feel that would bring consistency to the product. My first step was conducting a comprehensive audit of the UI elements currently in use, identifying redundancies and inconsistencies. I then introduced industry standards for native iOS and Android platforms, ensuring that the designs aligned with best practices and user expectations. Additionally, I led the effort to migrate text strings into a localization manager, enabling easy adaptation for different regions and languages.

<br>

<iframe style="border: 1px solid white;" width="800" height="450" src="https://embed.figma.com/design/VBnScDLbMBmHqbmeKMJsXa/%F0%9F%94%97Design-System?node-id=2-14322&embed-host=share" allowfullscreen></iframe>

<br>

The implementation of the design system had a significant impact on efficiency, consistency, and scalability. By providing a shared source of truth, we streamlined collaboration between designers and developers, reducing errors and improving workflow. The new framework also made scalability and localization seamless, allowing for expansion into new markets. Most importantly, it improved accessibility and usability, enhancing the experience for both healthcare professionals and patients with limited cognitive capacity.

<br>

[go back to top](#a-curated-selection-of-projects)

<br>

---

<br>


## Implementing New Processess

Beside the various design projects I led, there were a few projects out of the scope of Design that I championed in order to achieve company goals and/or to improve internal processes. 

One of the biggest ones was the Design System mentioned above which is a central artifact of UX/UI.
In addition, collaborating with the in house User Researcher we had began the developement and refinement of **Personas** and the **User Journey**. Moreover, in order to have a clear overview of the app structure, I took it upon myself to create an **App Map** listing all the screens included in Mika Health in a way that could help us maintain the overview of our development. It became an indispensible tool for the PMs and was of value to other departments as well.

Another big undertaking was championing the localisation effort before the app was released in the UK and the US. Prior to that, all text strings were hard-coded in the app and had no keys. In collaboration with the devs, we created keys that I maintained on Phrase while they painstakingly went through all the text strings in the app and connected them to the keys. Then, I trained our external translators to use Phrase and managed the project until its completion. This enabled us to release the App in the UK and the US in a timely manner.


<br>

[go back to top](#a-curated-selection-of-projects)

<br>

---

<br>


Thank you for your attention.

