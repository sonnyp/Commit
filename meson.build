project('gnomit', version: '1.0.4', meson_version: '>= 0.40.0',)

i18n = import('i18n')

subdir('data')
subdir('src')
subdir('po')

meson.add_install_script('build-aux/meson/postinstall.py')
