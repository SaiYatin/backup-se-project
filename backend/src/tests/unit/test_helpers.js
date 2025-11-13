const { apiResponse, sanitizeInput, calculateProgress, formatCurrency, randomString } = require('../../utils/helpers');

describe('Helpers Utility Tests', () => {
  test('test_apiResponse_formats_response', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    apiResponse(mockRes, 200, true, 'Success', { id: 1 });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalled();
  });

  test('test_sanitizeInput_escapes_html', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeInput(input);

    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  test('test_calculateProgress_returns_percentage', () => {
    const progress = calculateProgress(50, 100);

    expect(progress).toBe(50);
  });

  test('test_calculateProgress_handles_zero_target', () => {
    const progress = calculateProgress(50, 0);

    expect(progress).toBe(0);
  });

  test('test_formatCurrency_formats_amount', () => {
    const formatted = formatCurrency(1000);

    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
  });

  test('test_randomString_generates_string', () => {
    const str = randomString(10);

    expect(str).toHaveLength(10);
    expect(typeof str).toBe('string');
  });
});
