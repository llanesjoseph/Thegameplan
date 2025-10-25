# Direct Access Test

## Try This URL Directly:

```
https://playbookd.crucibleanalytics.dev/dashboard/athlete/reviews
```

**NOT** through the dashboard iframe.

## Expected Behavior:

If this works directly but fails in the iframe, then the issue is with how the parent dashboard loads iframes.

## Possible Solutions:

### Option 1: Make it a direct link instead of iframe
Change the sidebar to navigate directly to the reviews page instead of loading it in an iframe.

### Option 2: Fix the iframe loading
Ensure the parent page doesn't interfere with the iframe content.

### Option 3: Create a standalone route
Move the reviews page outside the athlete dashboard structure.

