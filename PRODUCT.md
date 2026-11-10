# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS/JavaScript prototype for a browser-based internal clinical registry.

## Users

Primary users are medical and occupational-health staff responsible for maintaining firefighter health records and follow-up controls. Secondary users include operational leadership and service administrators reviewing personnel status, pending evaluations, and upcoming clinical checks.

## Product Purpose

This product supports the registration, review, and follow-up of occupational health records for a fire service unit. It is designed to help staff track personal clinical status, upcoming medical controls, and outstanding evaluations while keeping a clear overview of active records.

## Positioning

The project is a specialized occupational-health record system for fire service personnel rather than a generic patient-management tool. Its differentiator is the combination of firefighter-specific operational context, preventive clinical follow-up, and a compact administrative dashboard for health monitoring.

## Operating Context

The product is used in a browser in an internal occupational-health or command environment. Workflows center on reviewing personnel records, checking control dates, identifying pending evaluations, and managing a lightweight set of example clinical entries. The current implementation is a front-end prototype and does not persist data beyond the active browser session.

## Capabilities and Constraints

- Maintain a list of registered personnel with clinical and occupational-health metadata.
- Surface summary counts for total records, upcoming controls, and pending evaluations.
- Support a clinical record workflow with sample entries and status badges.
- Provide separate forms for worker medical records, immunizations and physical assessment, and medical leave controls; drafts are temporary and can be printed from the browser.
- Provide navigation for personnel, evaluations, reports, and settings in an internal admin dashboard.
- The current codebase is static and demo-oriented; it has no backend or persistent database. Its sign-in is a local-only demonstration and is not production authentication.
- Demo sign-in accepts Venezuelan identity-card numbers with an optional `V` (Venezuelan) or `E` (foreigner) prefix and 5–10 digits.
- Demo accounts are held only in volatile page memory; passwords are not stored, and accounts disappear on reload. Never use real identity, password, or clinical data.
- Data shown in the interface is fictional and intended for demo purposes only.

## Brand Commitments

The product name is "Guardia" and the identity centers on a professional, clinical, and regulated occupational-health environment. The interface uses a black and charcoal base with restrained red accents inspired by angular, faceted geometry, alongside clear operational hierarchy rather than consumer-facing visual flair.

## Evidence on Hand

- index.html — main application structure and clinical workflow screens
- styles.css — confirmed design system, typography, spacing, colors, and UI tokens
- js/ — front-end logic for data, records, dialogs, UI interactions, and medical templates

## Product Principles

- Safety and clarity come before aesthetic experimentation.
- Medical follow-up must be visible, organized, and easy to act on.
- Operational workflows should remain simple, legible, and low-friction.
- The system should support administrative confidence without exposing unnecessary complexity.

## Accessibility & Inclusion

The implementation includes focus-visible states, semantic labels, and a high-contrast dark layout intended to support accessibility. Product-specific requirements for regulated healthcare needs or broader accessibility accommodations are not yet documented beyond the front-end patterns already present in the prototype.
