const fs = require('fs');
const code = fs.readFileSync('src/lib/supabaseService.ts', 'utf8');

const newMethod = `
  async getGeneralTasks(): Promise<GeneralTask[]> {
    const tasksMap = new Map<string, GeneralTask>();
    
    try {
      const localTasks = await api.getGeneralTasks().catch(() => []);
      for (const g of localTasks) {
        tasksMap.set(g.id, g);
      }
    } catch (err) {
      console.warn('Local general tasks fetch warning:', err);
    }
    
    if (supabase) {
      try {
        const { data: sbGeneral } = await db('general_tasks')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (sbGeneral) {
          sbGeneral.forEach((t: any) => {
            const taskObj: GeneralTask = {
              id: t.id,
              type: 'general',
              title: t.title || \`\${t.service_type || 'Task'} for \${t.customer_name || 'Customer'}\`,
              description: t.description || '',
              status: t.status || 'Pending',
              assignedStaffId: t.assigned_staff_id,
              assigned_staff_id: t.assigned_staff_id,
              adminNote: t.admin_note || '',
              admin_note: t.admin_note || '',
              staffUpdateNote: t.staff_update_note || '',
              staff_update_note: t.staff_update_note || '',
              dueDate: t.due_date || '',
              due_date: t.due_date || '',
              customerName: t.customer_name || '',
              mobileNumber: t.mobile_number || '',
              serviceType: t.service_type || 'General',
              totalAmount: t.total_amount || 0,
              amountPaid: t.amount_paid || 0,
              balanceDue: t.balance_due || 0,
              paymentStatus: t.payment_status || 'Unpaid',
              createdAt: t.created_at || new Date().toISOString(),
              updatedAt: t.updated_at || new Date().toISOString(),
              completedAt: t.completed_at || undefined,
            };
            tasksMap.set(taskObj.id, taskObj);
          });
        }
      } catch (e) {
        console.warn('Supabase general tasks query warning:', e);
      }
    }
    
    return Array.from(tasksMap.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  },
`;

const target = "async createStaffTask(taskData: {";
if (code.includes(target) && !code.includes('async getGeneralTasks() {')) {
  const newCode = code.replace(target, newMethod + '\n  ' + target);
  fs.writeFileSync('src/lib/supabaseService.ts', newCode);
  console.log('Successfully patched src/lib/supabaseService.ts');
} else {
  console.log('Target not found or already patched.');
}
