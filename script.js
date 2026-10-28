/* PeopleHub — Employee Management System
   Vanilla JavaScript, LocalStorage persistence, no backend required. */
"use strict";

const STORAGE_KEYS = {
  employees: "peoplehub_employees_v1",
  departments: "peoplehub_departments_v1"
};
const DEFAULT_DEPARTMENTS = ["Engineering", "Design", "Marketing", "Human Resources", "Finance", "Operations"];
const AVATAR_COLORS = [
  ["#273b51", "#9bd2ff"], ["#3c2e4d", "#d3b4ff"], ["#23453e", "#94e3c8"],
  ["#4b3828", "#ffd29b"], ["#4b2d38", "#ffb2c6"], ["#293e4b", "#a5e3ef"]
];
const DEPARTMENT_COLORS = ["#9384ff", "#53c7ad", "#f2b85e", "#6ebcff", "#e88cbd", "#9aa8ba", "#7ed2e5", "#c3a2ff"];
const DEPARTMENT_ICONS = ["⌘", "✎", "◈", "♙", "₹", "⚙", "✦", "▤"];
const PAGE_SIZE = 8;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key} from LocalStorage.`, error);
    return fallback;
  }
}
function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("LocalStorage write failed:", error);
    showToast("Could not save data. Browser storage may be full or disabled.", "error");
    return false;
  }
}
function makeSeedEmployees() {
  const today = new Date();
  const dateAgo = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  };
  return [
    { id: "EMP-1001", name: "Aditi Sharma", email: "aditi.sharma@example.com", phone: "+91 98765 10001", department: "Engineering", role: "Frontend Developer", salary: 68000, status: "Active", joiningDate: dateAgo(42), location: "Prayagraj, India" },
    { id: "EMP-1002", name: "Rahul Verma", email: "rahul.verma@example.com", phone: "+91 98765 10002", department: "Design", role: "UI/UX Designer", salary: 59000, status: "Active", joiningDate: dateAgo(75), location: "Lucknow, India" },
    { id: "EMP-1003", name: "Meera Singh", email: "meera.singh@example.com", phone: "+91 98765 10003", department: "Marketing", role: "Marketing Executive", salary: 48000, status: "On Leave", joiningDate: dateAgo(120), location: "Kanpur, India" },
    { id: "EMP-1004", name: "Arjun Patel", email: "arjun.patel@example.com", phone: "+91 98765 10004", department: "Engineering", role: "Backend Developer", salary: 74000, status: "Active", joiningDate: dateAgo(18), location: "Noida, India" },
    { id: "EMP-1005", name: "Sana Khan", email: "sana.khan@example.com", phone: "+91 98765 10005", department: "Human Resources", role: "HR Specialist", salary: 52000, status: "Active", joiningDate: dateAgo(95), location: "Prayagraj, India" },
    { id: "EMP-1006", name: "Kabir Joshi", email: "kabir.joshi@example.com", phone: "+91 98765 10006", department: "Finance", role: "Financial Analyst", salary: 63000, status: "Inactive", joiningDate: dateAgo(240), location: "Jaipur, India" },
    { id: "EMP-1007", name: "Isha Gupta", email: "isha.gupta@example.com", phone: "+91 98765 10007", department: "Operations", role: "Operations Associate", salary: 45000, status: "Active", joiningDate: dateAgo(9), location: "Delhi, India" },
    { id: "EMP-1008", name: "Dev Malhotra", email: "dev.malhotra@example.com", phone: "+91 98765 10008", department: "Design", role: "Product Designer", salary: 71000, status: "Active", joiningDate: dateAgo(160), location: "Mumbai, India" },
    { id: "EMP-1009", name: "Priya Nair", email: "priya.nair@example.com", phone: "+91 98765 10009", department: "Engineering", role: "QA Engineer", salary: 56000, status: "On Leave", joiningDate: dateAgo(32), location: "Bengaluru, India" },
    { id: "EMP-1010", name: "Vikram Das", email: "vikram.das@example.com", phone: "+91 98765 10010", department: "Marketing", role: "Content Strategist", salary: 50000, status: "Active", joiningDate: dateAgo(55), location: "Kolkata, India" }
  ];
}

let departments = safeRead(STORAGE_KEYS.departments, null);
if (!Array.isArray(departments) || !departments.length) {
  departments = [...DEFAULT_DEPARTMENTS];
  safeWrite(STORAGE_KEYS.departments, departments);
}
let employees = safeRead(STORAGE_KEYS.employees, null);
if (!Array.isArray(employees)) {
  employees = makeSeedEmployees();
  safeWrite(STORAGE_KEYS.employees, employees);
}
let currentPage = 1;
let selectedIds = new Set();
let toastTimerIds = new Set();

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
}
function colorFor(name) {
  let hash = 0;
  for (const char of String(name || "")) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount) || 0);
}
function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
function statusClass(status) {
  return ({ "Active": "status-active", "On Leave": "status-on-leave", "Inactive": "status-inactive" })[status] || "status-inactive";
}
function statusBadge(status) {
  return `<span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span>`;
}
function persistEmployees() {
  return safeWrite(STORAGE_KEYS.employees, employees);
}
function persistDepartments() {
  return safeWrite(STORAGE_KEYS.departments, departments);
}
function showToast(message, type = "success") {
  const region = $("#toastRegion");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = type === "error" ? "!" : "✓";
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(icon, text);
  region.appendChild(toast);
  const timer = setTimeout(() => {
    toast.remove();
    toastTimerIds.delete(timer);
  }, 3200);
  toastTimerIds.add(timer);
}
function setView(viewName) {
  const names = { dashboard: "Overview", employees: "Employees", departments: "Departments" };
  $$(".view").forEach(view => view.classList.toggle("active", view.id === `${viewName}View`));
  $$(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === viewName));
  $("#breadcrumbCurrent").textContent = names[viewName] || "Overview";
  $("#sidebar").classList.remove("open");
  if (viewName === "employees") renderEmployees();
  if (viewName === "departments") renderDepartments();
}
function getFilteredEmployees() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const department = $("#departmentFilter").value;
  const status = $("#statusFilter").value;
  const sort = $("#sortSelect").value;
  const list = employees.filter(employee => {
    const searchable = [employee.name, employee.id, employee.email, employee.role, employee.department, employee.phone, employee.location].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
      (!department || employee.department === department) &&
      (!status || employee.status === status);
  });
  list.sort((a, b) => {
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    if (sort === "joined-desc") return (b.joiningDate || "").localeCompare(a.joiningDate || "");
    if (sort === "salary-desc") return Number(b.salary) - Number(a.salary);
    return a.name.localeCompare(b.name);
  });
  return list;
}
function employeeCell(employee) {
  const [bg, fg] = colorFor(employee.name);
  return `<div class="employee-cell"><div class="employee-avatar" style="background:${bg};color:${fg}">${escapeHTML(initials(employee.name))}</div><div><span class="employee-name">${escapeHTML(employee.name)}</span><span class="employee-email">${escapeHTML(employee.email)}</span></div></div>`;
}
function renderDashboard() {
  const active = employees.filter(e => e.status === "Active").length;
  const leave = employees.filter(e => e.status === "On Leave").length;
  const inactive = employees.filter(e => e.status === "Inactive").length;
  const departmentNames = [...new Set([...departments, ...employees.map(e => e.department).filter(Boolean)])];
  const payroll = employees.filter(e => e.status !== "Inactive").reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
  $("#totalEmployees").textContent = employees.length.toLocaleString("en-IN");
  $("#activeEmployees").textContent = active.toLocaleString("en-IN");
  $("#departmentCount").textContent = departmentNames.length.toLocaleString("en-IN");
  $("#monthlyPayroll").textContent = formatCurrency(payroll);
  $("#navEmployeeCount").textContent = employees.length;
  $("#statusTotal").textContent = employees.length;
  $("#statusActive").textContent = active;
  $("#statusLeave").textContent = leave;
  $("#statusInactive").textContent = inactive;
  const total = employees.length || 1;
  const activeDeg = active / total * 360;
  const leaveDeg = activeDeg + leave / total * 360;
  $("#statusDonut").style.background = `conic-gradient(var(--green) 0deg ${activeDeg}deg, var(--amber) ${activeDeg}deg ${leaveDeg}deg, var(--red) ${leaveDeg}deg 360deg)`;

  const counts = departmentNames.map(name => ({ name, count: employees.filter(e => e.department === name).length }));
  const chartItems = counts.slice(0, 6);
  const maxCount = Math.max(1, ...chartItems.map(item => item.count));
  $("#departmentChart").innerHTML = chartItems.length ? chartItems.map((item, index) => `
    <div class="chart-column" title="${escapeHTML(item.name)}: ${item.count} employee(s)">
      <span class="chart-count">${item.count}</span>
      <div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(3, item.count / maxCount * 100)}%;background:linear-gradient(180deg,${DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]},${DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}88)"></div></div>
      <span class="chart-label">${escapeHTML(item.name.length > 10 ? item.name.slice(0, 9) + "…" : item.name)}</span>
    </div>`).join("") : `<div class="empty-state">No departments to display.</div>`;
  $("#chartLegend").innerHTML = chartItems.map((item, index) => `<span><i class="legend-swatch" style="background:${DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}"></i>${escapeHTML(item.name)} <b>${item.count}</b></span>`).join("");

  const recent = [...employees].sort((a, b) => (b.joiningDate || "").localeCompare(a.joiningDate || "")).slice(0, 5);
  $("#recentEmployeesBody").innerHTML = recent.map(employee => `<tr>
    <td>${employeeCell(employee)}</td><td>${escapeHTML(employee.department)}</td><td class="role-cell">${escapeHTML(employee.role)}</td>
    <td>${statusBadge(employee.status)}</td><td>${formatDate(employee.joiningDate)}</td></tr>`).join("");
  $("#recentEmpty").classList.toggle("hidden", recent.length > 0);
}
function renderDepartmentOptions() {
  const filter = $("#departmentFilter");
  const selectedFilter = filter.value;
  filter.innerHTML = `<option value="">All departments</option>` + departments.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("");
  if (departments.includes(selectedFilter)) filter.value = selectedFilter;
  const select = $("#employeeDepartment");
  const selectedDepartment = select.value;
  select.innerHTML = `<option value="">Select department</option>` + departments.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("");
  if (departments.includes(selectedDepartment)) select.value = selectedDepartment;
}
function renderEmployees() {
  const filtered = getFilteredEmployees();
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, currentPage), pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  $("#employeesBody").innerHTML = pageItems.map(employee => `<tr>
    <td><input type="checkbox" class="employee-check" data-id="${escapeHTML(employee.id)}" ${selectedIds.has(employee.id) ? "checked" : ""} aria-label="Select ${escapeHTML(employee.name)}"></td>
    <td>${employeeCell(employee)}</td><td class="id-cell">${escapeHTML(employee.id)}</td><td>${escapeHTML(employee.department)}</td>
    <td class="role-cell">${escapeHTML(employee.role)}</td><td>${formatCurrency(employee.salary)}</td><td>${statusBadge(employee.status)}</td>
    <td><div class="row-actions"><button class="action-btn" data-action="view" data-id="${escapeHTML(employee.id)}" title="View details" aria-label="View ${escapeHTML(employee.name)}">◉</button><button class="action-btn" data-action="edit" data-id="${escapeHTML(employee.id)}" title="Edit employee" aria-label="Edit ${escapeHTML(employee.name)}">✎</button><button class="action-btn delete" data-action="delete" data-id="${escapeHTML(employee.id)}" title="Delete employee" aria-label="Delete ${escapeHTML(employee.name)}">⌫</button></div></td>
    </tr>`).join("");
  $("#employeesEmpty").classList.toggle("hidden", filtered.length > 0);
  $(".table-footer").classList.toggle("hidden", filtered.length === 0);
  $("#resultsCount").textContent = filtered.length ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} employees` : "Showing 0 employees";
  $("#pageIndicator").textContent = `Page ${currentPage} of ${pageCount}`;
  $("#prevPage").disabled = currentPage <= 1;
  $("#nextPage").disabled = currentPage >= pageCount;
  const visibleIds = pageItems.map(e => e.id);
  $("#selectAll").checked = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  $("#selectAll").indeterminate = visibleIds.some(id => selectedIds.has(id)) && !$("#selectAll").checked;
  updateBulkBar();
}
function renderDepartments() {
  const names = [...new Set([...departments, ...employees.map(e => e.department).filter(Boolean)])];
  $("#departmentCards").innerHTML = names.map((name, index) => {
    const members = employees.filter(e => e.department === name);
    const active = members.filter(e => e.status === "Active").length;
    return `<article class="department-card"><div class="department-card-top"><div class="department-icon" style="background:${DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}20;color:${DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}">${DEPARTMENT_ICONS[index % DEPARTMENT_ICONS.length]}</div><button class="action-btn delete" data-department-delete="${escapeHTML(name)}" title="Delete department" aria-label="Delete ${escapeHTML(name)} department">⌫</button></div><h3>${escapeHTML(name)}</h3><p>${active} active ${active === 1 ? "team member" : "team members"}</p><div class="department-card-footer"><span>Total employees</span><strong>${members.length}</strong></div></article>`;
  }).join("");
}
function renderAll() {
  renderDepartmentOptions();
  renderDashboard();
  renderEmployees();
  renderDepartments();
}
function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  const focusable = modal.querySelector("input:not([type=hidden]), select, button");
  if (focusable) setTimeout(() => focusable.focus(), 30);
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
  if ($$(".modal-backdrop:not(.hidden)").length === 0) document.body.style.overflow = "";
}
function openAddEmployee() {
  $("#employeeForm").reset();
  $("#editEmployeeId").value = "";
  $("#modalTitle").textContent = "Add employee";
  $("#saveEmployeeBtn").textContent = "Save employee";
  $("#employeeId").readOnly = false;
  $("#employeeStatus").value = "Active";
  $("#employeeJoiningDate").value = new Date().toISOString().slice(0, 10);
  $("#formError").classList.add("hidden");
  renderDepartmentOptions();
  openModal("employeeModal");
}
function openEditEmployee(id) {
  const employee = employees.find(item => item.id === id);
  if (!employee) return showToast("Employee record not found.", "error");
  $("#employeeForm").reset();
  $("#editEmployeeId").value = employee.id;
  $("#employeeName").value = employee.name;
  $("#employeeId").value = employee.id;
  $("#employeeId").readOnly = true;
  $("#employeeEmail").value = employee.email;
  $("#employeePhone").value = employee.phone || "";
  renderDepartmentOptions();
  $("#employeeDepartment").value = employee.department;
  $("#employeeRole").value = employee.role;
  $("#employeeSalary").value = employee.salary;
  $("#employeeJoiningDate").value = employee.joiningDate;
  $("#employeeStatus").value = employee.status;
  $("#employeeLocation").value = employee.location || "";
  $("#modalTitle").textContent = "Edit employee";
  $("#saveEmployeeBtn").textContent = "Save changes";
  $("#formError").classList.add("hidden");
  openModal("employeeModal");
}
function showEmployeeDetails(id) {
  const employee = employees.find(item => item.id === id);
  if (!employee) return;
  const details = [
    `Name: ${employee.name}`, `Employee ID: ${employee.id}`, `Email: ${employee.email}`,
    `Phone: ${employee.phone || "Not provided"}`, `Department: ${employee.department}`,
    `Job title: ${employee.role}`, `Monthly salary: ${formatCurrency(employee.salary)}`,
    `Status: ${employee.status}`, `Joining date: ${formatDate(employee.joiningDate)}`,
    `Location: ${employee.location || "Not provided"}`
  ].join("\n");
  window.alert(details);
}
function validateEmployee(data, editingId) {
  if (!data.name.trim() || !data.id.trim() || !data.email.trim() || !data.department || !data.role.trim() || !data.joiningDate || !data.status) {
    return "Please complete all required fields.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Please enter a valid email address.";
  if (!Number.isFinite(data.salary) || data.salary < 0) return "Salary must be zero or greater.";
  if (employees.some(employee => employee.id.toLowerCase() === data.id.toLowerCase() && employee.id !== editingId)) {
    return "That employee ID already exists. Please use a unique ID.";
  }
  if (employees.some(employee => employee.email.toLowerCase() === data.email.toLowerCase() && employee.id !== editingId)) {
    return "That email address is already assigned to another employee.";
  }
  return "";
}
function saveEmployee(event) {
  event.preventDefault();
  const editingId = $("#editEmployeeId").value;
  const data = {
    id: $("#employeeId").value.trim(),
    name: $("#employeeName").value.trim(),
    email: $("#employeeEmail").value.trim(),
    phone: $("#employeePhone").value.trim(),
    department: $("#employeeDepartment").value,
    role: $("#employeeRole").value.trim(),
    salary: Number($("#employeeSalary").value),
    joiningDate: $("#employeeJoiningDate").value,
    status: $("#employeeStatus").value,
    location: $("#employeeLocation").value.trim()
  };
  const error = validateEmployee(data, editingId);
  if (error) {
    $("#formError").textContent = error;
    $("#formError").classList.remove("hidden");
    return;
  }
  if (editingId) {
    const index = employees.findIndex(employee => employee.id === editingId);
    if (index < 0) return showToast("Employee record no longer exists.", "error");
    employees[index] = { ...employees[index], ...data };
  } else {
    employees.push(data);
  }
  if (!persistEmployees()) return;
  closeModal("employeeModal");
  currentPage = 1;
  selectedIds.delete(data.id);
  renderAll();
  showToast(editingId ? "Employee details updated successfully." : "Employee added successfully.");
}
function deleteEmployee(id) {
  const employee = employees.find(item => item.id === id);
  if (!employee) return;
  if (!window.confirm(`Delete ${employee.name} (${employee.id})? This cannot be undone.`)) return;
  employees = employees.filter(item => item.id !== id);
  selectedIds.delete(id);
  persistEmployees();
  renderAll();
  showToast("Employee record deleted.");
}
function updateBulkBar() {
  const existingIds = new Set(employees.map(employee => employee.id));
  selectedIds = new Set([...selectedIds].filter(id => existingIds.has(id)));
  $("#selectedCount").textContent = `${selectedIds.size} selected`;
  $("#bulkBar").classList.toggle("hidden", selectedIds.size === 0);
}
function deleteSelected() {
  if (!selectedIds.size) return;
  const count = selectedIds.size;
  if (!window.confirm(`Delete ${count} selected employee record(s)? This cannot be undone.`)) return;
  employees = employees.filter(employee => !selectedIds.has(employee.id));
  selectedIds.clear();
  persistEmployees();
  renderAll();
  showToast(`${count} employee record(s) deleted.`);
}
function exportCSV() {
  const rows = getFilteredEmployees();
  if (!rows.length) return showToast("There are no employee records to export.", "error");
  const headers = ["Employee ID", "Full Name", "Email", "Phone", "Department", "Job Title", "Monthly Salary (INR)", "Status", "Joining Date", "Location"];
  const csvCell = value => {
    let safe = String(value ?? "");
    // Guard against spreadsheet formula injection in user-entered text.
    if (/^[=+\-@\t\r]/.test(safe)) safe = "'" + safe;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = [headers, ...rows.map(e => [e.id, e.name, e.email, e.phone, e.department, e.role, e.salary, e.status, e.joiningDate, e.location])];
  const csv = "\uFEFF" + lines.map(row => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `peoplehub-employees-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`Exported ${rows.length} employee record(s) to CSV.`);
}
function addDepartment() {
  const name = $("#departmentNameInput").value.trim();
  if (!name) {
    $("#departmentError").textContent = "Enter a department name.";
    $("#departmentError").classList.remove("hidden");
    return;
  }
  if (departments.some(item => item.toLowerCase() === name.toLowerCase())) {
    $("#departmentError").textContent = "That department already exists.";
    $("#departmentError").classList.remove("hidden");
    return;
  }
  departments.push(name);
  if (!persistDepartments()) return;
  $("#departmentForm").reset();
  $("#departmentError").classList.add("hidden");
  closeModal("departmentModal");
  renderAll();
  showToast(`Department "${name}" added.`);
}
function deleteDepartment(name) {
  const count = employees.filter(employee => employee.department === name).length;
  if (count) return showToast(`Move or reassign the ${count} employee(s) in ${name} before deleting it.`, "error");
  if (!window.confirm(`Delete the "${name}" department?`)) return;
  departments = departments.filter(item => item !== name);
  persistDepartments();
  renderAll();
  showToast("Department deleted.");
}
function setTodayLabel() {
  const now = new Date();
  $("#todayLabel").textContent = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now).toUpperCase();
}
function bindEvents() {
  $$(".nav-link").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  $$("[data-goto]").forEach(button => button.addEventListener("click", () => setView(button.dataset.goto)));
  $("#addEmployeeTop").addEventListener("click", openAddEmployee);
  $("#addEmployeeBtn").addEventListener("click", openAddEmployee);
  $("#emptyAddBtn").addEventListener("click", openAddEmployee);
  $("#employeeForm").addEventListener("submit", saveEmployee);
  $("#addDepartmentBtn").addEventListener("click", () => {
    $("#departmentForm").reset();
    $("#departmentError").classList.add("hidden");
    openModal("departmentModal");
  });
  $("#departmentForm").addEventListener("submit", event => { event.preventDefault(); addDepartment(); });
  $$("[data-close]").forEach(button => button.addEventListener("click", () => closeModal(button.dataset.close)));
  $$(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal(backdrop.id);
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") $$(".modal-backdrop:not(.hidden)").forEach(modal => closeModal(modal.id));
  });
  ["searchInput", "departmentFilter", "statusFilter", "sortSelect"].forEach(id => {
    const element = $(`#${id}`);
    element.addEventListener(id === "searchInput" ? "input" : "change", () => { currentPage = 1; renderEmployees(); });
  });
  $("#employeesBody").addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "view") showEmployeeDetails(id);
    if (action === "edit") openEditEmployee(id);
    if (action === "delete") deleteEmployee(id);
  });
  $("#employeesBody").addEventListener("change", event => {
    const checkbox = event.target.closest(".employee-check");
    if (!checkbox) return;
    if (checkbox.checked) selectedIds.add(checkbox.dataset.id);
    else selectedIds.delete(checkbox.dataset.id);
    renderEmployees();
  });
  $("#selectAll").addEventListener("change", event => {
    const visible = getFilteredEmployees().slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    visible.forEach(employee => event.target.checked ? selectedIds.add(employee.id) : selectedIds.delete(employee.id));
    renderEmployees();
  });
  $("#prevPage").addEventListener("click", () => { currentPage--; renderEmployees(); });
  $("#nextPage").addEventListener("click", () => { currentPage++; renderEmployees(); });
  $("#bulkDeleteBtn").addEventListener("click", deleteSelected);
  $("#clearSelectionBtn").addEventListener("click", () => { selectedIds.clear(); renderEmployees(); });
  $("#exportBtn").addEventListener("click", exportCSV);
  $("#exportTopBtn").addEventListener("click", exportCSV);
  $("#departmentCards").addEventListener("click", event => {
    const button = event.target.closest("[data-department-delete]");
    if (button) deleteDepartment(button.dataset.departmentDelete);
  });
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  document.addEventListener("click", event => {
    if (window.innerWidth <= 760 && $("#sidebar").classList.contains("open") &&
        !$("#sidebar").contains(event.target) && !$("#mobileMenu").contains(event.target)) {
      $("#sidebar").classList.remove("open");
    }
  });
  window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEYS.employees || event.key === STORAGE_KEYS.departments) {
      employees = safeRead(STORAGE_KEYS.employees, []);
      departments = safeRead(STORAGE_KEYS.departments, DEFAULT_DEPARTMENTS);
      renderAll();
      showToast("Data refreshed from another browser tab.");
    }
  });
}

function init() {
  setTodayLabel();
  bindEvents();
  renderAll();
}
document.addEventListener("DOMContentLoaded", init);
