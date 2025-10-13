bin_conf = configuration_data()
bin_conf.set('GJS', find_program('gjs').full_path())
bin_conf.set('version', meson.project_version())
bin_conf.set('app_id', app_id)
bin_conf.set('prefix', prefix)
bin_conf.set('libdir', join_paths(get_option('prefix'), get_option('libdir')))
bin_conf.set('datadir', datadir)
bin_conf.set('pkgdatadir', pkgdatadir)

configure_file(
  input: 'bin.js',
  output: 're.sonny.Commit',
  configuration: bin_conf,
  install: true,
  install_dir: get_option('bindir'),
)

blueprint_compiler = find_program('blueprint-compiler')
gjspack = find_program(meson.project_source_root() / 'troll/gjspack/bin/gjspack', 'gjspack')
custom_target(
  'gjspack',
  input: ['main.js', '../po/POTFILES'],
  output: app_id + '.src.gresource',
  command: [
    gjspack,
    '--appid=' + app_id,
    '--prefix', '/re/sonny/Commit',
    '--project-root', meson.project_source_root(),
    '--resource-root', meson.project_source_root() / 'src',
    '--blueprint-compiler', blueprint_compiler,
    '--no-executable', '@INPUT0@',
    '--potfiles', '@INPUT1@',
    '@OUTDIR@',
  ],
  install: true,
  install_dir: pkgdatadir,
  build_always_stale: true,
)
