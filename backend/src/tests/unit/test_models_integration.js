const { sequelize } = require('../../config/database');
const { User, Event, Pledge, Report } = require('../../models');

describe('Models Integration Tests', () => {
  test('test_User_model_exists', () => {
    expect(User).toBeDefined();
  });

  test('test_Event_model_exists', () => {
    expect(Event).toBeDefined();
  });

  test('test_Pledge_model_exists', () => {
    expect(Pledge).toBeDefined();
  });

  test('test_Report_model_exists', () => {
    expect(Report).toBeDefined();
  });

  test('test_models_have_methods', () => {
    expect(typeof User.findByPk).toBe('function');
    expect(typeof Event.findAll).toBe('function');
    expect(typeof Pledge.count).toBe('function');
  });
});
