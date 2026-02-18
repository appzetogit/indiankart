import re
import sys

def remove_dark_classes(filepath):
    """Remove dark mode Tailwind classes from a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match dark: prefixed classes
    patterns = [
        r' dark:bg-[^\s"\']+',
        r' dark:text-[^\s"\']+',
        r' dark:border-[^\s"\']+',
        r' dark:hover:[^\s"\']+',
        r' dark:active:[^\s"\']+',
        r' dark:opacity-[^\s"\']+',
    ]
    
    for pattern in patterns:
        content = re.sub(pattern, '', content)
    
    # Also handle specific instances
    content = content.replace('bg-background-light dark:bg-background-dark', 'bg-background-light')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Processed: {filepath}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        remove_dark_classes(sys.argv[1])
