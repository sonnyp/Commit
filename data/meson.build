desktop_file = i18n.merge_file(
  input: 'ind.ie.Gnomit.desktop.in',
  output: 'ind.ie.Gnomit.desktop',
  type: 'desktop',
  po_dir: '../po',
  install: true,
  install_dir: join_paths(get_option('datadir'), 'applications')
)

desktop_utils = find_program('desktop-file-validate', required: false)
if desktop_utils.found()
  test('Validate desktop file', desktop_utils,
    args: [desktop_file]
  )
endif

appstream_file = i18n.merge_file(
  input: 'ind.ie.Gnomit.appdata.xml.in',
  output: 'ind.ie.Gnomit.appdata.xml',
  po_dir: '../po',
  install: true,
  install_dir: join_paths(get_option('datadir'), 'appdata')
)

appstream_util = find_program('appstream-util', required: false)
if appstream_util.found()
  test('Validate appstream file', appstream_util,
    args: ['validate', appstream_file]
  )
endif

install_data('ind.ie.Gnomit.gschema.xml',
  install_dir: join_paths(get_option('datadir'), 'glib-2.0/schemas')
)

compile_schemas = find_program('glib-compile-schemas', required: false)
if compile_schemas.found()
  test('Validate schema file', compile_schemas,
    args: ['--strict', '--dry-run', meson.current_source_dir()]
  )
endif

# Install the icon.

install_data ('icons/16x16/ind.ie.Gnomit.png', install_dir: join_paths(get_option('datadir'), 'icons/hicolor/16x16/apps'))
install_data ('icons/24x24/ind.ie.Gnomit.png', install_dir: join_paths(get_option('datadir'), 'icons/hicolor/24x24/apps'))
install_data ('icons/32x32/ind.ie.Gnomit.png', install_dir: join_paths(get_option('datadir'), 'icons/hicolor/32x32/apps'))
install_data ('icons/48x48/ind.ie.Gnomit.png', install_dir: join_paths(get_option('datadir'), 'icons/hicolor/48x48/apps'))
install_data ('icons/512x512/ind.ie.Gnomit.png', install_dir: join_paths(get_option('datadir'), 'icons/hicolor/512x512/apps'))
