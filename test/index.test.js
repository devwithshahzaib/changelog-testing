const app = require('../server');

describe('index.js', () => {

  describe('make sure app.listen is called with the correct port and host', () => {
    it('should call app.listen with the correct port and host', () => {
      app.listen = jest.fn();
      delete require.cache[require.resolve('../index.js')];
      require('../index.js');
      expect(app.listen).toHaveBeenCalledWith(Number(3000), '0.0.0.0', expect.any(Function));
    });
  });
});