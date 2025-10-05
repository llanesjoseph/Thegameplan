# Accessibility Guidelines

## Required Attributes

### Images
- Always include `alt` attribute
- Use descriptive text, not "image of"
- Empty alt="" for decorative images

### Buttons & Links
- Include `aria-label` for icon-only buttons
- Use semantic HTML (`<button>` not `<div onClick>`)
- Ensure keyboard navigation works

### Forms
- Label all inputs with `<label>` or `aria-label`
- Use `aria-required` for required fields
- Add `aria-invalid` and `aria-describedby` for errors

### Interactive Elements
- Set `role` attribute when needed
- Use `aria-expanded` for collapsible content
- Add `aria-live` for dynamic content updates

## Component Checklist
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ratio >= 4.5:1
- [ ] Screen reader tested
