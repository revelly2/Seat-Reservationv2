import UserHomePage from '@/app/page';
import AdminPage from '@/app/admin/page';

describe('Portal Separation: User Portal vs Admin Console', () => {
  test('User HomePage component exports UserDashboard for route /', () => {
    expect(UserHomePage).toBeDefined();
    expect(typeof UserHomePage).toBe('function');
  });

  test('Admin Page component exports AdminDashboard for route /admin', () => {
    expect(AdminPage).toBeDefined();
    expect(typeof AdminPage).toBe('function');
  });
});
