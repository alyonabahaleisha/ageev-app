/* eslint-env jest */
export {};
// Валидация загрузок в кэш аудио: HTML-заглушка с кодом 200, обрезанный файл и
// HTTP-ошибка не должны попадать в кэш.

type Dl = {
  statusCode: number;
  bytesWritten: number;
  headers?: Record<string, string>;
  contentLength?: number;
  size?: number;
};

function load(dl: Dl) {
  const fs = {
    CachesDirectoryPath: '/caches',
    mkdir: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(false),
    moveFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({size: dl.size ?? dl.bytesWritten}),
    downloadFile: jest.fn((opts: any) => {
      opts.begin?.({
        jobId: 1,
        statusCode: dl.statusCode,
        contentLength: dl.contentLength ?? dl.bytesWritten,
        headers: dl.headers ?? {},
      });
      return {
        jobId: 1,
        promise: Promise.resolve({
          jobId: 1,
          statusCode: dl.statusCode,
          bytesWritten: dl.bytesWritten,
          headers: dl.headers ?? {},
        }),
      };
    }),
  };
  let mod: any;
  jest.isolateModules(() => {
    jest.doMock('@dr.pogodin/react-native-fs', () => fs);
    jest.doMock('../src/services/analytics', () => ({track: jest.fn()}));
    mod = require('../src/services/audioCache');
  });
  return {mod, fs};
}

const SRC_URL = 'https://storage.yandexcloud.net/ageev-app-test/audio/x.m4a';
const MB = 1024 * 1024;

describe('downloadAudio validation', () => {
  it('caches a complete audio response', async () => {
    const {mod, fs} = load({
      statusCode: 200,
      bytesWritten: 5 * MB,
      headers: {'Content-Type': 'audio/x-m4a'},
    });
    expect(await mod.downloadAudio('t1', SRC_URL)).toBe('cached');
    expect(fs.moveFile).toHaveBeenCalledWith(
      '/caches/audio/t1.m4a.part',
      '/caches/audio/t1.m4a',
    );
  });

  it('rejects an HTML block page served with 200', async () => {
    const {mod, fs} = load({
      statusCode: 200,
      bytesWritten: 3000,
      headers: {'content-type': 'text/html; charset=utf-8'},
    });
    expect(await mod.downloadAudio('t1', SRC_URL)).toBe('invalid_content');
    expect(fs.moveFile).not.toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledWith('/caches/audio/t1.m4a.part');
  });

  it('rejects a truncated file (size != Content-Length)', async () => {
    const {mod, fs} = load({
      statusCode: 200,
      bytesWritten: 2 * MB,
      contentLength: 5 * MB,
      headers: {'Content-Type': 'audio/mpeg'},
    });
    expect(await mod.downloadAudio('t1', SRC_URL)).toBe('invalid_content');
    expect(fs.moveFile).not.toHaveBeenCalled();
  });

  it('rejects HTTP errors', async () => {
    const {mod, fs} = load({statusCode: 403, bytesWritten: 200});
    expect(await mod.downloadAudio('t1', SRC_URL)).toBe('http_error');
    expect(fs.moveFile).not.toHaveBeenCalled();
  });

  it('removeCachedAudio deletes the file and its temp part', async () => {
    const {mod, fs} = load({statusCode: 200, bytesWritten: 0});
    await mod.removeCachedAudio('t1', SRC_URL);
    expect(fs.unlink).toHaveBeenCalledWith('/caches/audio/t1.m4a');
    expect(fs.unlink).toHaveBeenCalledWith('/caches/audio/t1.m4a.part');
  });
});
