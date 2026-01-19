export type Platform = 'windows' | 'darwin' | 'linux';

export function getPlatform(): Platform {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'darwin';
  return 'linux';
}

export function isWindows(): boolean {
  return getPlatform() === 'windows';
}

export function isDarwin(): boolean {
  return getPlatform() === 'darwin';
}

export function isLinux(): boolean {
  return getPlatform() === 'linux';
}

export function getArchitecture(): 'x64' | 'x86' | 'arm64' {
  const arch = process.arch;
  if (arch === 'x64') return 'x64';
  if (arch === 'ia32') return 'x86';
  if (arch === 'arm64') return 'arm64';
  return 'x64';
}
