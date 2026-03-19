import re
import os

frontend_dir = r"e:\PrithviCore\agridrishti\frontend"
css_path = os.path.join(frontend_dir, "src", "app", "globals.css")
tailwind_path = os.path.join(frontend_dir, "tailwind.config.js")

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    r, g, b = tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))
    return f"{r} {g} {b}"

# 1. Update globals.css
with open(css_path, "r", encoding='utf-8') as f:
    css_content = f.read()

def replacer(match):
    prop = match.group(1)
    hx = match.group(2)
    rgb_str = hex_to_rgb(hx)
    return f"--{prop}: {rgb_str};"

# Replace hex codes for the specific variables
variables = ["background", "foreground", "card", "card-foreground", "popover", "popover-foreground", 
             "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", 
             "accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring"]

pattern = r"--(" + "|".join(variables) + r"):\s*#([0-9a-fA-F]{3,6});"
css_content = re.sub(pattern, replacer, css_content)

# We might also need to replace var(--glow-primary) uses if they assume rgb, but they are defined as rgba(). So it's fine.

with open(css_path, "w", encoding='utf-8') as f:
    f.write(css_content)

# 2. Update tailwind.config.js
with open(tailwind_path, "r", encoding='utf-8') as f:
    tw_content = f.read()

for var in variables:
    # Look for Default inside nested objects or direct assignment
    if var in ["primary", "secondary", "destructive", "muted", "accent", "popover", "card"]:
        tw_content = re.sub(rf'DEFAULT:\s*"var\(--{var}\)"', f'DEFAULT: "rgb(var(--{var}) / <alpha-value>)"', tw_content)
        tw_content = re.sub(rf'foreground:\s*"var\(--{var}-foreground\)"', f'foreground: "rgb(var(--{var}-foreground) / <alpha-value>)"', tw_content)
    else:
        tw_content = re.sub(rf'{var}:\s*"var\(--{var}\)"', f'{var}: "rgb(var(--{var}) / <alpha-value>)"', tw_content)
        tw_content = re.sub(rf'"{var}":\s*"var\(--{var}\)"', f'{var}: "rgb(var(--{var}) / <alpha-value>)"', tw_content)

with open(tailwind_path, "w", encoding='utf-8') as f:
    f.write(tw_content)

print("Migration successful")
