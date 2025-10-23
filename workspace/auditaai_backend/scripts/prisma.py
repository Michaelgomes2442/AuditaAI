"""Prisma Client Generation Script"""

import asyncio
import subprocess
from pathlib import Path


def generate():
    """Generate Prisma client"""
    root_dir = Path(__file__).parent.parent
    prisma_dir = root_dir / "prisma"

    print("Generating Prisma client...")
    result = subprocess.run(
        ["prisma", "generate"],
        cwd=prisma_dir,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("Error generating Prisma client:")
        print(result.stderr)
        exit(1)
    
    print("Prisma client generated successfully")


if __name__ == "__main__":
    generate()