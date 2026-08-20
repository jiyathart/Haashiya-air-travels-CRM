import { 
  FlightType, 
  TicketBooking, 
  PassportProcess, 
  GeneralTask,
  ReminderItem, 
  ReminderCategory,
  StaffUser 
} from '../types';

export function calculateReportingDateTime(
  departureDate: string, 
  departureTime: string, 
  flightType: FlightType
): { reportingDate: string; reportingTime: string } {
  if (!departureDate || !departureTime) {
    return { reportingDate: departureDate || '', reportingTime: departureTime || '' };
  }
  
  try {
    const [year, month, day] = departureDate.split('-').map(Number);
    const [hours, minutes] = departureTime.split(':').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      return { reportingDate: departureDate, reportingTime: departureTime };
    }

    const hoursToSubtract = flightType === 'International' ? 3 : 2;
    const depDateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
    depDateObj.setHours(depDateObj.getHours() - hoursToSubtract);

    const rYear = depDateObj.getFullYear();
    const rMonth = String(depDateObj.getMonth() + 1).padStart(2, '0');
    const rDay = String(depDateObj.getDate()).padStart(2, '0');
    const rHours = String(depDateObj.getHours()).padStart(2, '0');
    const rMins = String(depDateObj.getMinutes()).padStart(2, '0');

    return {
      reportingDate: `${rYear}-${rMonth}-${rDay}`,
      reportingTime: `${rHours}:${rMins}`
    };
  } catch {
    return { reportingDate: departureDate, reportingTime: departureTime };
  }
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeLabel(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function generateReminders(
  tickets: TicketBooking[],
  passports: PassportProcess[],
  generalTasks: GeneralTask[] = [],
  staffList: StaffUser[],
  acknowledgedIds: string[] = []
): ReminderItem[] {
  const reminders: ReminderItem[] = [];
  const staffMap = new Map(staffList.map(s => [s.id, s.name]));

  const now = new Date();
  const todayStr = getYYYYMMDD(now);
  
  const tomorrowObj = new Date(now);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = getYYYYMMDD(tomorrowObj);

  // 1. Process Passport Appointments
  passports.forEach(p => {
    if (p.passportStatus === 'Delivered') return; // Completed
    if (!p.appointmentDate) return;

    const staffName = staffMap.get(p.assignedStaffId) || 'Unassigned';
    const apptDateStr = p.appointmentDate;
    const daysDiff = getDaysDifference(todayStr, apptDateStr);

    let category: ReminderCategory | null = null;
    let alertReason = '';
    let severity: 'high' | 'medium' | 'low' = 'medium';

    if (daysDiff < 0) {
      category = 'Overdue';
      alertReason = `Passport appointment was scheduled for ${formatDateLabel(apptDateStr)} at ${p.appointmentTime || 'N/A'}`;
      severity = 'high';
    } else if (daysDiff === 0) {
      category = 'Today';
      alertReason = `Passport appointment TODAY at ${p.appointmentTime || 'N/A'} (PSK: ${p.passportSevaKendra || 'N/A'})`;
      severity = 'high';
    } else if (daysDiff === 1) {
      category = 'Tomorrow';
      alertReason = `Passport appointment TOMORROW at ${p.appointmentTime || 'N/A'} (PSK: ${p.passportSevaKendra || 'N/A'})`;
      severity = 'high';
    } else if (daysDiff <= 7) {
      category = 'Upcoming';
      alertReason = `Passport appointment in ${daysDiff} days (${formatDateLabel(apptDateStr)} at ${p.appointmentTime || 'N/A'})`;
      severity = daysDiff <= 3 ? 'high' : 'medium';
    }

    if (category) {
      const remId = `rem-pass-${p.id}-${category.toLowerCase()}-${apptDateStr}`;
      reminders.push({
        id: remId,
        bookingType: 'passport',
        bookingId: p.id,
        title: `Passport Appt: ${p.applicantName}`,
        subtitle: `Ref: ${p.applicationNumber || 'N/A'} | Status: ${p.passportStatus}`,
        targetDate: p.appointmentDate,
        targetTime: p.appointmentTime,
        category,
        assignedStaffId: p.assignedStaffId,
        assignedStaffName: staffName,
        isAcknowledged: acknowledgedIds.includes(remId),
        alertReason,
        severity
      });
    }

    // Check stalled passport work (3+ days without update)
    if (p.updatedAt) {
      const hoursSinceUpdate = (now.getTime() - new Date(p.updatedAt).getTime()) / (1000 * 3600);
      if (hoursSinceUpdate >= 72) {
        const stalledDays = Math.floor(hoursSinceUpdate / 24);
        const remId = `rem-pass-stalled-${p.id}`;
        reminders.push({
          id: remId,
          bookingType: 'passport',
          bookingId: p.id,
          title: `Stalled Passport: ${p.applicantName}`,
          subtitle: `No status update for ${stalledDays} days (${p.passportStatus})`,
          targetDate: todayStr,
          category: 'Stalled',
          assignedStaffId: p.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `Last updated ${formatDateTimeLabel(p.updatedAt)}. Please progress this case or add a note.`,
          severity: 'medium'
        });
      }
    }

    // Check Payment Due Alerts for Passports
    if (p.balanceDue && p.balanceDue > 0) {
      const daysDiff = p.appointmentDate ? getDaysDifference(todayStr, p.appointmentDate) : 999;
      if (daysDiff <= 3) {
        let cat: ReminderCategory = 'Upcoming';
        if (daysDiff < 0) cat = 'Overdue';
        else if (daysDiff === 0) cat = 'Today';
        else if (daysDiff === 1) cat = 'Tomorrow';

        const remId = `rem-pass-pay-due-${p.id}-${cat.toLowerCase()}`;
        reminders.push({
          id: remId,
          bookingType: 'passport',
          bookingId: p.id,
          title: `Payment Due: ${p.applicantName}`,
          subtitle: `Balance Due: ₹${p.balanceDue.toLocaleString('en-IN')} (${p.paymentStatus})`,
          targetDate: p.appointmentDate || todayStr,
          category: cat,
          assignedStaffId: p.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `Appointment date is ${daysDiff <= 0 ? 'today/past' : `in ${daysDiff} days`} but balance ₹${p.balanceDue.toLocaleString('en-IN')} remains unpaid.`,
          severity: 'high'
        });
      }

      // Check 7+ days with no payment
      const lastPayDate = p.payments && p.payments.length > 0
        ? new Date(p.payments[p.payments.length - 1].createdAt || p.payments[p.payments.length - 1].date)
        : new Date(p.createdAt || Date.now());
      const daysNoPay = Math.floor((now.getTime() - lastPayDate.getTime()) / (1000 * 3600 * 24));

      if (daysNoPay >= 7) {
        const remId = `rem-pass-pay-idle-${p.id}`;
        reminders.push({
          id: remId,
          bookingType: 'passport',
          bookingId: p.id,
          title: `Payment Idle (7+ Days): ${p.applicantName}`,
          subtitle: `Balance Due: ₹${p.balanceDue.toLocaleString('en-IN')}`,
          targetDate: todayStr,
          category: 'Stalled',
          assignedStaffId: p.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `No payment recorded for ${daysNoPay} days. Outstanding balance is ₹${p.balanceDue.toLocaleString('en-IN')}.`,
          severity: 'high'
        });
      }
    }
  });

  // 2. Process Ticket Flight Reporting Times
  tickets.forEach(t => {
    if (t.ticketStatus === 'Completed' || t.ticketStatus === 'Cancelled') return;
    if (!t.reportingDate) return;

    const staffName = staffMap.get(t.assignedStaffId) || 'Unassigned';
    const repDateStr = t.reportingDate;
    const daysDiff = getDaysDifference(todayStr, repDateStr);

    let category: ReminderCategory | null = null;
    let alertReason = '';
    let severity: 'high' | 'medium' | 'low' = 'medium';

    if (daysDiff < 0) {
      category = 'Overdue';
      alertReason = `Reporting time was ${formatDateLabel(repDateStr)} at ${t.reportingTime || 'N/A'} (${t.airline} ${t.flightNumber})`;
      severity = 'high';
    } else if (daysDiff === 0) {
      category = 'Today';
      alertReason = `Flight reporting TODAY at ${t.reportingTime || 'N/A'} (Departs ${t.departureTime} from ${t.departureAirport})`;
      severity = 'high';
    } else if (daysDiff === 1) {
      category = 'Tomorrow';
      alertReason = `Flight reporting TOMORROW at ${t.reportingTime || 'N/A'} (${t.airline} ${t.flightNumber} PNR: ${t.pnr})`;
      severity = 'high';
    } else if (daysDiff <= 3) {
      category = 'Upcoming';
      alertReason = `Flight reporting in ${daysDiff} days on ${formatDateLabel(repDateStr)} at ${t.reportingTime || 'N/A'}`;
      severity = 'medium';
    }

    if (category) {
      const remId = `rem-tkt-${t.id}-${category.toLowerCase()}-${repDateStr}`;
      reminders.push({
        id: remId,
        bookingType: 'ticket',
        bookingId: t.id,
        title: `Flight Reporting: ${t.customerName}`,
        subtitle: `${t.airline} ${t.flightNumber} | PNR: ${t.pnr || 'N/A'} (${t.ticketStatus})`,
        targetDate: t.reportingDate,
        targetTime: t.reportingTime,
        category,
        assignedStaffId: t.assignedStaffId,
        assignedStaffName: staffName,
        isAcknowledged: acknowledgedIds.includes(remId),
        alertReason,
        severity
      });
    }

    // Check stalled ticket work (3+ days without update)
    if (t.updatedAt) {
      const hoursSinceUpdate = (now.getTime() - new Date(t.updatedAt).getTime()) / (1000 * 3600);
      if (hoursSinceUpdate >= 72) {
        const stalledDays = Math.floor(hoursSinceUpdate / 24);
        const remId = `rem-tkt-stalled-${t.id}`;
        reminders.push({
          id: remId,
          bookingType: 'ticket',
          bookingId: t.id,
          title: `Stalled Ticket: ${t.customerName}`,
          subtitle: `No status update for ${stalledDays} days (${t.ticketStatus})`,
          targetDate: todayStr,
          category: 'Stalled',
          assignedStaffId: t.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `Last updated ${formatDateTimeLabel(t.updatedAt)}. Please follow up on flight details or issue ticket.`,
          severity: 'medium'
        });
      }
    }

    // Check Payment Due Alerts for Tickets
    if (t.balanceDue && t.balanceDue > 0) {
      const daysDiff = t.departureDate ? getDaysDifference(todayStr, t.departureDate) : 999;
      if (daysDiff <= 3) {
        let cat: ReminderCategory = 'Upcoming';
        if (daysDiff < 0) cat = 'Overdue';
        else if (daysDiff === 0) cat = 'Today';
        else if (daysDiff === 1) cat = 'Tomorrow';

        const remId = `rem-tkt-pay-due-${t.id}-${cat.toLowerCase()}`;
        reminders.push({
          id: remId,
          bookingType: 'ticket',
          bookingId: t.id,
          title: `Payment Due: ${t.customerName}`,
          subtitle: `Balance Due: ₹${t.balanceDue.toLocaleString('en-IN')} (${t.paymentStatus})`,
          targetDate: t.departureDate || todayStr,
          category: cat,
          assignedStaffId: t.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `Flight departure is ${daysDiff <= 0 ? 'today/past' : `in ${daysDiff} days`} but balance ₹${t.balanceDue.toLocaleString('en-IN')} remains unpaid.`,
          severity: 'high'
        });
      }

      // Check 7+ days with no payment
      const lastPayDate = t.payments && t.payments.length > 0
        ? new Date(t.payments[t.payments.length - 1].createdAt || t.payments[t.payments.length - 1].date)
        : new Date(t.createdAt || Date.now());
      const daysNoPay = Math.floor((now.getTime() - lastPayDate.getTime()) / (1000 * 3600 * 24));

      if (daysNoPay >= 7) {
        const remId = `rem-tkt-pay-idle-${t.id}`;
        reminders.push({
          id: remId,
          bookingType: 'ticket',
          bookingId: t.id,
          title: `Payment Idle (7+ Days): ${t.customerName}`,
          subtitle: `Balance Due: ₹${t.balanceDue.toLocaleString('en-IN')}`,
          targetDate: todayStr,
          category: 'Stalled',
          assignedStaffId: t.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `No payment recorded for ${daysNoPay} days. Outstanding balance is ₹${t.balanceDue.toLocaleString('en-IN')}.`,
          severity: 'high'
        });
      }
    }
  });

  // 3. Process General Tasks
  generalTasks.forEach(gt => {
    if (gt.status === 'Ready / Completed' || gt.status === 'Delivered' || gt.status === 'Cancelled') return;

    const staffName = staffMap.get(gt.assignedStaffId) || 'Unassigned';

    // Due Date Reminders
    if (gt.dueDate) {
      const daysDiff = getDaysDifference(todayStr, gt.dueDate);
      let category: ReminderCategory | null = null;
      let alertReason = '';
      let severity: 'high' | 'medium' | 'low' = 'medium';

      if (daysDiff < 0) {
        category = 'Overdue';
        alertReason = `General Task (${gt.serviceType}) was due on ${formatDateLabel(gt.dueDate)}`;
        severity = 'high';
      } else if (daysDiff === 0) {
        category = 'Today';
        alertReason = `General Task (${gt.serviceType}) is due TODAY`;
        severity = 'high';
      } else if (daysDiff === 1) {
        category = 'Tomorrow';
        alertReason = `General Task (${gt.serviceType}) is due TOMORROW`;
        severity = 'high';
      } else if (daysDiff <= 7) {
        category = 'Upcoming';
        alertReason = `General Task (${gt.serviceType}) due in ${daysDiff} days (${formatDateLabel(gt.dueDate)})`;
        severity = daysDiff <= 3 ? 'high' : 'medium';
      }

      if (category) {
        const remId = `rem-gt-${gt.id}-${category.toLowerCase()}-${gt.dueDate}`;
        reminders.push({
          id: remId,
          bookingType: 'general',
          bookingId: gt.id,
          title: `Task Due: ${gt.customerName} (${gt.serviceType})`,
          subtitle: `Status: ${gt.status} | Mobile: ${gt.mobileNumber}`,
          targetDate: gt.dueDate,
          category,
          assignedStaffId: gt.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason,
          severity
        });
      }
    }

    // Check stalled general task work (3+ days without update)
    if (gt.updatedAt) {
      const hoursSinceUpdate = (now.getTime() - new Date(gt.updatedAt).getTime()) / (1000 * 3600);
      if (hoursSinceUpdate >= 72) {
        const stalledDays = Math.floor(hoursSinceUpdate / 24);
        const remId = `rem-gt-stalled-${gt.id}`;
        reminders.push({
          id: remId,
          bookingType: 'general',
          bookingId: gt.id,
          title: `Stalled Task: ${gt.customerName}`,
          subtitle: `No status update for ${stalledDays} days (${gt.serviceType} - ${gt.status})`,
          targetDate: todayStr,
          category: 'Stalled',
          assignedStaffId: gt.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `Last updated ${formatDateTimeLabel(gt.updatedAt)}. Please progress this request or log a note.`,
          severity: 'medium'
        });
      }
    }

    // Check Payment Due Alerts for General Tasks
    if (gt.balanceDue && gt.balanceDue > 0) {
      const daysDiff = gt.dueDate ? getDaysDifference(todayStr, gt.dueDate) : 999;
      if (daysDiff <= 3) {
        let cat: ReminderCategory = 'Upcoming';
        if (daysDiff < 0) cat = 'Overdue';
        else if (daysDiff === 0) cat = 'Today';
        else if (daysDiff === 1) cat = 'Tomorrow';

        const remId = `rem-gt-pay-due-${gt.id}-${cat.toLowerCase()}`;
        reminders.push({
          id: remId,
          bookingType: 'general',
          bookingId: gt.id,
          title: `Payment Due: ${gt.customerName}`,
          subtitle: `Service: ${gt.serviceType} | Balance: ₹${gt.balanceDue.toLocaleString('en-IN')}`,
          targetDate: gt.dueDate || todayStr,
          category: cat,
          assignedStaffId: gt.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `Due date is ${daysDiff <= 0 ? 'today/past' : `in ${daysDiff} days`} but balance ₹${gt.balanceDue.toLocaleString('en-IN')} remains unpaid.`,
          severity: 'high'
        });
      }

      // Check 7+ days with no payment
      const lastPayDate = gt.payments && gt.payments.length > 0
        ? new Date(gt.payments[gt.payments.length - 1].createdAt || gt.payments[gt.payments.length - 1].date)
        : new Date(gt.createdAt || Date.now());
      const daysNoPay = Math.floor((now.getTime() - lastPayDate.getTime()) / (1000 * 3600 * 24));

      if (daysNoPay >= 7) {
        const remId = `rem-gt-pay-idle-${gt.id}`;
        reminders.push({
          id: remId,
          bookingType: 'general',
          bookingId: gt.id,
          title: `Payment Idle (7+ Days): ${gt.customerName}`,
          subtitle: `Service: ${gt.serviceType} | Balance: ₹${gt.balanceDue.toLocaleString('en-IN')}`,
          targetDate: todayStr,
          category: 'Stalled',
          assignedStaffId: gt.assignedStaffId,
          assignedStaffName: staffName,
          isAcknowledged: acknowledgedIds.includes(remId),
          alertReason: `No payment recorded for ${daysNoPay} days. Outstanding balance is ₹${gt.balanceDue.toLocaleString('en-IN')}.`,
          severity: 'high'
        });
      }
    }
  });

  return reminders;
}

function getYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDaysDifference(fromDateStr: string, toDateStr: string): number {
  try {
    const [y1, m1, d1] = fromDateStr.split('-').map(Number);
    const [y2, m2, d2] = toDateStr.split('-').map(Number);

    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);

    const diffTime = date2.getTime() - date1.getTime();
    return Math.round(diffTime / (1000 * 3600 * 24));
  } catch {
    return 999;
  }
}
