---
title:  "Design System Rollout & Management"
metadate: "hide"
categories: [ Product Design ]
image: "/assets/images/item/NorthstarDS.png"

---

>Built a design system from scratch, unifying iOS & Android, enabling localisation into UK and US markets, and giving developers a single source of truth for the first time.

Before implementing the design system, the healthcare application faced several challenges. There was no centralized design system, leading to inconsistencies in user interface and experience. Developers lacked a single source of truth, which often resulted in discrepancies between design and implementation. Additionally, design elements were disconnected across different platforms, creating a fragmented experience. Documentation was incomplete, making it difficult to track various use cases, variants, and error states. As a result, technical debt increased, slowing down development. Moreover, there was no framework for scaling or localizing the product, which limited its growth potential.

<br>
##### Design Audit

{% comment %} Replace preview PNG: post-mika-ds-overview-2-54414.svg · label→ Open Figma: design system {% endcomment %}
{% include figma-embed-overlay.html embed_url="https://embed.figma.com/design/VBnScDLbMBmHqbmeKMJsXa/Design-System?node-id=2-54414&embed-host=share" preview_src="/assets/images/figma-previews/post-mika-ds-overview-2-54414.png" label="Open Figma: design system" %}


To address these issues, I was tasked with creating a branded look and feel that would bring consistency to the product. My first step was conducting a comprehensive audit of the UI elements currently in use, identifying redundancies and inconsistencies. I then introduced industry standards for native iOS and Android platforms, ensuring that the designs aligned with best practices and user expectations. Additionally, I led the effort to migrate text strings into a localization manager, enabling easy adaptation for different regions and languages.


<br>
##### New System

{% comment %} Replace preview PNG: post-mika-ds-components-2-14322.svg · label→ Open Figma: design system (components) {% endcomment %}
{% include figma-embed-overlay.html embed_url="https://embed.figma.com/design/VBnScDLbMBmHqbmeKMJsXa/Design-System?node-id=2-14322&embed-host=share" preview_src="/assets/images/figma-previews/post-mika-ds-components-2-14322.png" label="Open Figma: design system (components)" %}


The implementation of the design system had a significant impact on efficiency, consistency, and scalability. By providing a shared source of truth, we streamlined collaboration between designers and developers, reducing errors and improving workflow. The new framework also made scalability and localization seamless, allowing for expansion into new markets. Most importantly, it improved accessibility and usability, enhancing the experience for both patients and healthcare professionals.