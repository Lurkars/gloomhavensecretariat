---
name: :bug: Bug report
about: Create a report to about something not working as expected
title: ""
labels: ["bug"]
assignees: 'Lurkars'
body:
- type: textarea
    id: bug-description
    attributes:
      label: Describe the bug
      description: |
        A clear and concise description of what the bug is.
    validations:
      required: true
  - type: textarea
    id: reproduce
    attributes:
      label: To Reproduce
      description: |
        Steps to reproduce the behavior:
      value: |
        1. Go to '...'
        2. Click on '....'
        3. Scroll down to '....'
        4. See error
    validations:
      required: true
  - type: textarea
    id: expected-behavior
    attributes:
      label: Expected behavior
      description: A clear and concise description of what you expected to happen.
    validations:
      required: true
  - type: input
    id: ghs-version
    attributes:
      label: Gloomhaven Secretariat Version
      description: You can see your version number in the about menu.
      placeholder: ex. v0.71.3
    validations:
      required: true
  - type: input
    id: browser
    attributes:
      label: Used Browser
      description: Please provide your used browser incl. version
      placeholder: ex. Firefox 116.0 (64-bit)
    validations:
      required: true
  - type: input
    id: os
    attributes:
      label: OS
      description: Please provide your used operating system
      placeholder: ex. Windows 11 or iOS 17
    validations:
      required: true
  - type: markdown
    id: additional
    attributes:
      label: Additional
      description: Any additional information
    validations:
      required: true