const { sequelize } = require('../../config/database');

describe('Database Config Tests', () => {
  test('test_sequelize_instance_exists', () => {
    expect(sequelize).toBeDefined();
  });

  test('test_sequelize_has_authenticate_method', () => {
    expect(typeof sequelize.authenticate).toBe('function');
  });

  test('test_sequelize_has_define_method', () => {
    expect(typeof sequelize.define).toBe('function');
  });
});
