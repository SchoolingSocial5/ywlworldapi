import { Request, Response } from 'express';
import Order from '../models/Order';
import Purchase from '../models/Purchase';
import Product from '../models/Product';
import Expense from '../models/Expense';
import User from '../models/User';

export const getFinanceData = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    // Construct Date Range Query for Orders (using createdAt)
    let dateQuery: any = {};
    if (from || to) {
      dateQuery.createdAt = {};
      if (from) dateQuery.createdAt.$gte = new Date(from as string);
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = toDate;
      }
    }

    // Construct Date Range Query for Purchases and Expenses (using date field)
    let transactionDateQuery: any = {};
    if (from || to) {
      transactionDateQuery.date = {};
      if (from) transactionDateQuery.date.$gte = new Date(from as string);
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        transactionDateQuery.date.$lte = toDate;
      }
    }

    // 1. SALES - Retail Sales
    const retailOrders = await Order.find({ paymentStatus: 'paid', ...dateQuery });
    let retailSalesQty = 0;
    for (const order of retailOrders) {
      for (const item of order.items) {
        retailSalesQty += item.quantity || 1;
      }
    }
    const retailSalesAmount = retailOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    // 3. PURCHASES - Retail Purchases
    const purchases = await Purchase.find(transactionDateQuery);
    let retailPurchasesQty = 0;
    let retailPurchasesAmount = 0;

    for (const p of purchases) {
      const isRetail = await Product.exists({ _id: p.productId });
      if (isRetail) {
        retailPurchasesQty += p.quantity || 0;
        retailPurchasesAmount += (p.quantity || 0) * (p.costPrice || 0);
      } else {
        // Default to retail
        retailPurchasesQty += p.quantity || 0;
        retailPurchasesAmount += (p.quantity || 0) * (p.costPrice || 0);
      }
    }

    // 4. EXPENSES - Retail Expenses
    const expenses = await Expense.find(transactionDateQuery);
    let retailExpensesQty = 0;
    let retailExpensesAmount = 0;

    for (const e of expenses) {
      const dept = (e as any).department;
      if (dept === 'Retail') {
        retailExpensesQty += 1;
        retailExpensesAmount += e.amount || 0;
      } else {
        retailExpensesQty += 1;
        retailExpensesAmount += e.amount || 0;
      }
    }

    // 5. SALARY - Retail Staff Salary
    const staffUsers = await User.find({
      $or: [
        { role: 'staff' },
        { status: 'staff' },
        { staffSalary: { $exists: true, $ne: '' } }
      ]
    });

    let retailSalariesQty = 0;
    let retailSalariesAmount = 0;

    for (const user of staffUsers) {
      const salaryStr = user.staffSalary || '0';
      const salaryNum = parseFloat(salaryStr.replace(/[^0-9.]/g, '')) || 0;
      
      retailSalariesQty += 1;
      retailSalariesAmount += salaryNum;
    }

    const retailResponse: any = {
      sales: { name: 'Retail Sales', quantity: retailSalesQty, amount: retailSalesAmount },
      purchases: { name: 'Retail Purchases', quantity: retailPurchasesQty, amount: retailPurchasesAmount },
      expenses: { name: 'Retail Expenses', quantity: retailExpensesQty, amount: retailExpensesAmount },
      salary: { name: 'Retail Staff Salaries', quantity: retailSalariesQty, amount: retailSalariesAmount }
    };

    res.json({
      retail: retailResponse,
      wholesale: null
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
