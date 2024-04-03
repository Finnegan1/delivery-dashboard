#!/usr/bin/env python3

import string


def render_file(file_path: str, values: dict):
    print(f'templating {file_path} file')
    with open(file=file_path) as f:
        data = string.Template(f.read()).substitute(values)

    with open(file=file_path, mode="w") as f:
        f.write(data)


if __name__ == "__main__":
    print('Start templating script')
    print()

    with open('VERSION', 'r') as version_file:
        version = version_file.read().strip()

    template = {
        'build_version': version,
    }

    print(f'build number: {version}')

    render_file('.env.production', template)

    print()
    print('Script finished')
