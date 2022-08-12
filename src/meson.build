pkgdatadir = join_paths(get_option('datadir'), meson.project_name())
gnome = import('gnome')

gjspack = find_program('../troll/gjspack/bin/gjspack')
run_command(gjspack, '--appid=' + meson.project_name(), '--no-executable', 'src/main.js', 'src', check: true)

install_data('re.sonny.Commit.gresource',
  install_dir: pkgdatadir
)

bin_conf = configuration_data()
bin_conf.set('GJS', find_program('gjs').full_path())
bin_conf.set('PACKAGE_VERSION', meson.project_version())
bin_conf.set('PACKAGE_NAME', meson.project_name())
bin_conf.set('prefix', get_option('prefix'))
bin_conf.set('libdir', join_paths(get_option('prefix'), get_option('libdir')))
bin_conf.set('datadir', join_paths(get_option('prefix'), get_option('datadir')))

configure_file(
  input: 're.sonny.Commit',
  output: 're.sonny.Commit',
  configuration: bin_conf,
  install: true,
  install_dir: get_option('bindir')
)
