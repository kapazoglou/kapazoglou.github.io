The following Design Process I developed in collaboration with the Product Manager at Mika Health. The app was focused on providing information and support to cancer patients throughout their patient journey. 
I implemented a step by step pipeline with multiple stakeholder touchpoints and clear transitions from each step to the next.

> Through the implementation of the Design Process we managed to:
> * Improve inter-departmental communication
> * Establish clear accountability
> * Get timely and explicit stakeholder buy-in
> * Smoothly fit within Tech processes such as Sprints
> * Well documented steps that facilitate auditing processes

In this section I will present you this process with examples from the Treatment Plan feature we built.

<br>

##### 1. Opportunity/Problem Definition & Research
Upon receiving a brief I check to see that I have all the relevant information, then note the stakeholders to loop in and clearly define the limits of the scope with them and the PM in order to avoid scope creep. The PM and I look for opportunities to minimise and combine the project with backlog issues or anything reducing tech debt. The project is then allocated a time estimate and a priority in the roadmap.

After that I start research and ideation looking at:
* best practices on Mobbin and in-house competitor analysis
* AI suggestions i.e. Stitch
* the User Journey and relevant Personas
* data from in-House User Research & Behavioural Science

> ###### Example: Treatment Plan Best Practice Analysis
> *For the purposes of a partnership as well as a grant we were required to track user adherence to medication. In order to do that we first had to lay a framework for users to add and track their medication and medical appointments in-app. This was prioritised as it was also an often requested feature from our users. We started our research by analysing best practices in competitive apps*
>
> {% comment %} Replace preview: curated-design-best-practice-analysis.svg · label→ Open Figma: treatment plan best practice analysis 
> {% include figma-embed-overlay.html embed_url="https://embed.figma.com/design/HX3mj9ddgNqlu3wOlYc6Ld/%F0%9F%94%97-Treatment-Plan-Best-Practice-Analysis?node-id=4038-83822&embed-host=share" preview_src="/assets/images/figma-previews/curated-design-best-practice-analysis.png" label="Open Figma: treatment plan best practice analysis" variant="on-dark" %} {% endcomment %}

<br>

##### 2. Flow diagram
Once all the information is in place the next step is to generate a flow diagram and get it in front of the stakeholders as rapidly as possible. With this diagram as a talking point I can:
* establish feedback loops
* get stakeholder buy-in
* check with backend for feasibility & briefing them on requirements 
* align with the content team 
* perform high level user testing if necessary

The process is iterated, feedback is incorporated and documented as required.

> ###### Example: Treatment Plan Diagram
> *Because of the scope of this feature, or rather feature collection, I designed a high level diagram along with a more in-depth object diagram in order to refine requirements with backend.*
>
> {% comment %} Replace preview: curated-design-treatment-diagrams.svg · label→ Open Figma: treatment plan diagrams {% endcomment %}
> {% include figma-embed-overlay.html embed_url="https://embed.figma.com/design/4W5mpXGi4lT1gpFiJd5k10/%F0%9F%94%97-Treatment-Plan-Diagrams?node-id=1-17403&embed-host=share" preview_src="/assets/images/figma-previews/curated-design-treatment-diagrams.png" label="Open Figma: treatment plan diagrams" variant="on-dark" %}

<br>

##### 3. Wireframes
Once the diagram has been agreed, the flow is then fleshed out more into wireframes where navigation and interactions start to be defined. By presenting the Wireframes I collect: 
* further stakeholder buy-in. 
* frontend comment for feasibility and agreement on Design System components and interaction patterns to be used
* QA & frontend comment on error handling and exceptions
* user feedback through user testing with clickdummies

The process is iterated, feedback is incorporated and documented as required.

> ###### Example: Treatment Plan Wireframes
> *Having done the work in advance, the diagram helped us to assess the scope of the project and parr it down to a feasible MVP. From there I defined the main user actions according to the agreed requirements and created wireframes. The wireframes were sucessfuly tested with users with a clickdummy*
>
> {% comment %} Replace preview: curated-design-treatment-wireframes.svg · label→ Open Figma: treatment plan wireframes {% endcomment %}
> {% include figma-embed-overlay.html embed_url="https://embed.figma.com/design/p5jXXfAPMNSAZmGhhuWwXw/%F0%9F%94%97-Treatment-Plan-Wireframes?node-id=4003-11949&embed-host=share" preview_src="/assets/images/figma-previews/curated-design-treatment-wireframes.png" label="Open Figma: treatment plan wireframes" variant="on-dark" %}


<br>

##### 4. Screen design
Once there is enough feedback incorporated into the wireframes, the screen design process cas start where
design system components, templates and interaction patterns are applied. These screens are then taken to refinement so that:

* We can run final user testing with full prototypes
* QA, Front- & Backend are briefed as to the requirements
* A development plan can start being formed
* Work packages can be agreed upon with specified start dates/Sprints 

The process is iterated, feedback is incorporated and documented as required.

> ###### Example: Treatment Plan Screen Design
> *The screen designs were finalised in suggested work packages for devs, starting with the MVP. Most of the components were already existing in the Design System and the reuse of templates made it easier to generate all of them quickly. After that all interactions were defined as per the interaction patterns commonly used in the app. The screens were then taken into Tech refinement to ensure that readiness is achieved*
> {% comment %} Replace preview: curated-design-treatment-screens.svg · label→ Open Figma: treatment plan screens {% endcomment %}
> {% include figma-embed-overlay.html embed_url="https://embed.figma.com/design/W28UGT8CPwbK3pdXhDMV3k/%F0%9F%94%97-Treatment-Plan-Screens?node-id=1-17403&embed-host=share" preview_src="/assets/images/figma-previews/curated-design-treatment-screens.png" label="Open Figma: treatment plan screens" variant="on-dark" %}

<br>

##### 5. Handover readiness
Once the screens are approved, the project is checked against the Definition of Readiness for the Design team and prepared for handover.

* Screens for both iOS & Android
* Design System components are checked, updated or incorporated as necessary
* Section and frame names, localisation keys and tokens are checked 
* Behaviour annotation is added as necessary

After this the screens with their comments are marked as Ready for Development together with all the annotations and attached to the relevant Tech tickets.