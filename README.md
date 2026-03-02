# Carbon CCalc-List

CList-Calc is a standard list-based calculation plugin for Obsidian. It helps you quickly perform calculations on lists, making it ideal for tracking **daily or monthly expenses, budgets, project costs, shopping lists, or personal finance tracking**.
With CList-Calc, you can use simple or nested lists to organize your data and apply calculations like sum, average, count, min/max, and more, directly in your Obsidian notes.
## Example use cases:
- Daily Expenses – Track meals, transport, and shopping costs.
- Monthly Budget – Calculate total spending across multiple categories.
- Shopping List – Sum item costs automatically.
- Project Costs – Manage expenses for materials, labor, and overhead.
- Holiday Planning – Track hotel, transport, and activity costs.
- Personal Finance – Keep track of income, bills, and savings.
___
Release Version: V1.0

Language: #javascript

Support: All platforms.

Author:Abdurnurporag

### CCalc-list use
```txt
BlockName:ccalc-list
```
### Available Function
```txt
General Function:

1. Sum(var)
2. Avg(var)//Avoid it insted of it use Count()
3. Count(var)
4. Max(var)
5. Min(var)
6. Median(var)
7. Mode(var)
8. Range(var)
9. MaxLabel(var)
10. MinLabel(var)
11. AscadingList(var)
12. DscadingList(var)
13. TotalChecked(var)
14. TotalUnChecked(var)
15. TotalCheckbox(var)
16. StdDev(var)
17. Var(var)
```
### Math Function
```txt
Math Function:
1. Root(var||num)
2. nRoot(value,n)
3. Power(value,power)
4. Floor(var||num)
5. Round(var||num)
6. Ceil(var||num)
7. Abs(var||num)
8. Log(var||num)
9. Ln(var||num)
10. Sin(var||num)
11. Cos(var||num)
12. Tan(var||num)
13. Cot(var||num)
14. Sec(var||num)
15. Cosec(var||num)
16. ASin(var||num)// inverse of sin
17. ACos(var||num)// inverse of cos
18. ATan(var||num)// inverse of tan
```
```txt
Angle in degree
```
## Access var name
```txt
General list:
			Var name,
For nested list:
			ParentName.childName...
```
# How to use?
Copy after here and paste in obsidian notes and see.
I think you will understand.

## Simple brief
As beginner you first follow the simple list. Then go nested.

## List Syntex:
Simple List:
- MyBugget
	- [x] Egg=199*30
	- [x] Chicken= 189*230
```clist-calc
Total Cost=Sum(MyBugget)
```
Simple List:
- [x] MyCost
	- [ ] Bus Ticket=600
	- [ ] Plane Ticket=8000
```clist-calc
Total Cost=Sum(MyCost)
```
Nested List:
- Holiday Cost
	- Hotel
		- [ ] Alpha Sea=10000
		- [ ] Black Core=20000
	- Airplane
		- [ ] Dhaka to Chattogram = 23000
		- [ ] Chottogram to Katmandu =45000
```clist-calc
Hotel Cost=Sum(Holiday Cost.Hotel)
Airplane Cost=Sum(Holiday Cost.Airplane)
Total Cost=Sum(Holiday Cost)

```

### Comments And Show
```txt
/*use multiple line comment*/
// use for hide
"Showing value"//use for showing something
```
Example:
```clist-calc
/*this is comment*/
Print=" Here showing text"
// hiddenNum=10;
 hiddenNun=hiddenNum
 
```
### Demo Project
- MyFinance
    - DailyExpenses
        - [x] Breakfast = 150
        - [x] Lunch = 300
        - [x] Dinner = 250
        - [x] Transport = 120
    - MonthlyBills
        - Rent = 15000
        - Utilities
            - Electricity = 2200
            - Water = 500
            - Internet = 1200
        - Subscriptions
            - Netflix = 800
            - Spotify = 500
            - News = 300
    - Savings
        - [x] FixedDeposit = 10000
        - [ ] EmergencyFund = 5000
    - Investments
        - Stock
            - Tesla = 20000
            - Apple = 15000
        - MutualFund
            - FundA = 5000
            - FundB = 10000

```clist-calc
/* General Function Examples */
TotalDaily = Sum(MyFinance.DailyExpenses)
AverageDaily = Avg(MyFinance.DailyExpenses)
MaxExpense = Max(MyFinance.DailyExpenses)
MinExpense = Min(MyFinance.DailyExpenses)
CountExpenses = Count(MyFinance.DailyExpenses)
RangeExpenses = Range(MyFinance.DailyExpenses)
StdDevExpenses = StdDev(MyFinance.DailyExpenses)
VarExpenses = Var(MyFinance.DailyExpenses)
TotalCheckedItems = TotalChecked(MyFinance.Savings)
TotalUnCheckedItems = TotalUnChecked(MyFinance.Savings)
AscDailyExpenses = AscadingList(MyFinance.DailyExpenses)
DescDailyExpenses = DscadingList(MyFinance.DailyExpenses)
MaxLabelExpense = MaxLabel(MyFinance.DailyExpenses)
MinLabelExpense = MinLabel(MyFinance.DailyExpenses)

/* Nested Totals */
TotalUtilities = Sum(MyFinance.MonthlyBills.Utilities)
TotalSubscriptions = Sum(MyFinance.MonthlyBills.Subscriptions)
TotalBills = Sum(MyFinance.MonthlyBills)
TotalInvestments = Sum(MyFinance.Investments.Stock) + Sum(MyFinance.Investments.MutualFund)
TotalFinance = Sum(MyFinance.DailyExpenses) + TotalBills + TotalInvestments + Sum(MyFinance.Savings)

```


CList Calc is open source. You can use, modify, and redistribute it freely. 
The author is not responsible for any issues caused by using or modifying this plugin.



