// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 设置输入限制和焦点
    document.getElementById('housePrice').focus();

    // 添加输入事件监听
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            validateInput(this);
        });
    });
    
    // 初始化隐藏详细分析区域
    const detailedAnalysis = document.getElementById('detailedAnalysis');
    if (detailedAnalysis) {
        detailedAnalysis.style.display = 'none';
    }
});

// 格式化数字为货币
function formatCurrency(number) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

// 格式化百分比
function formatPercent(number) {
    return number.toFixed(2) + '%';
}

// 输入验证
function validateInput(input) {
    const value = input.value;
    
    // 确保输入非负数
    if (value < 0) {
        input.value = 0;
    }
    
    // 首付比例限制在0-100之间
    if (input.id === 'downPayment' && value > 100) {
        input.value = 100;
    }
    
    // 贷款年限限制在1-30之间
    if (input.id === 'loanYears') {
        if (value > 30) input.value = 30;
        if (value < 1) input.value = 1;
    }
}

// 切换详细分析面板
function toggleAnalysis() {
    const detailedAnalysis = document.getElementById('detailedAnalysis');
    const toggle = document.querySelector('.analysis-toggle');
    
    if (detailedAnalysis.classList.contains('active')) {
        detailedAnalysis.classList.remove('active');
        toggle.classList.remove('active');
        toggle.querySelector('span').innerHTML = '<i class="fas fa-chart-bar"></i> 查看详细分析';
        
        setTimeout(() => {
            detailedAnalysis.style.display = 'none';
        }, 300);
    } else {
        detailedAnalysis.style.display = 'block';
        
        setTimeout(() => {
            detailedAnalysis.classList.add('active');
            toggle.classList.add('active');
            toggle.querySelector('span').innerHTML = '<i class="fas fa-chart-bar"></i> 隐藏详细分析';
        }, 10);
    }
}

// 计算函数
function calculate() {
    // 获取输入值
    const housePrice = parseFloat(document.getElementById('housePrice').value) * 10000; // 转换为元
    
    // 输入验证
    if (isNaN(housePrice) || housePrice <= 0) {
        showError('请输入有效的房屋总价');
        return;
    }
    
    const downPayment = parseFloat(document.getElementById('downPayment').value) / 100;
    const loanRate = parseFloat(document.getElementById('loanRate').value) / 100;
    const loanYears = parseInt(document.getElementById('loanYears').value);
    const propertyTaxRate = parseFloat(document.getElementById('propertyTax').value) / 100;
    const maintenance = parseFloat(document.getElementById('maintenance').value);
    const insurance = parseFloat(document.getElementById('insurance').value);
    
    // 获取出售相关输入
    const holdingYears = parseInt(document.getElementById('holdingYears').value);
    const sellingCostRate = parseFloat(document.getElementById('sellingCost').value) / 100;
    const houseArea = parseFloat(document.getElementById('houseArea').value);

    // 计算贷款金额
    const loanAmount = housePrice * (1 - downPayment);

    // 计算月供
    const monthlyRate = loanRate / 12;
    const totalMonths = loanYears * 12;
    const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) 
        / (Math.pow(1 + monthlyRate, totalMonths) - 1);

    // 计算年房产税
    const annualPropertyTax = housePrice * propertyTaxRate;

    // 计算月均维护和保险费
    const monthlyMaintenance = maintenance / 12;
    const monthlyInsurance = insurance / 12;
    
    // 计算月均房产税
    const monthlyPropertyTax = annualPropertyTax / 12;

    // 计算贷款总利息
    const totalInterest = (monthlyPayment * totalMonths) - loanAmount;
    
    // 计算月供中的本金和利息部分（首月）
    const interestPerMonth = loanAmount * monthlyRate;
    const principalPerMonth = monthlyPayment - interestPerMonth;
    
    // 计算总还款额
    const totalRepayment = loanAmount + totalInterest;

    // 计算年总持有成本
    const totalAnnualCost = monthlyPayment * 12 + annualPropertyTax + maintenance + insurance;
    
    // 计算成本占比（用于图表）
    const principalRatio = (loanAmount / totalRepayment) * 100;
    const interestRatio = (totalInterest / totalRepayment) * 100;
    const taxRatio = (annualPropertyTax / totalAnnualCost) * 100;
    const otherRatio = ((maintenance + insurance) / totalAnnualCost) * 100;
    
    // 计算盈亏平衡价格
    // 1. 计算持有期总成本
    let holdingCost = 0;
    
    // 如果持有期小于等于贷款期限
    if (holdingYears <= loanYears) {
        // 计算持有期内的贷款支出
        holdingCost = monthlyPayment * holdingYears * 12;
    } else {
        // 如果持有期超过贷款期限，只计算贷款期限内的月供
        holdingCost = monthlyPayment * totalMonths;
    }
    
    // 加上房产税、维护费和保险费
    holdingCost += (annualPropertyTax + maintenance + insurance) * holdingYears;
    
    // 2. 计算需要回收的总成本
    const totalCostToRecover = housePrice + holdingCost;
    
    // 3. 考虑销售环节的费用
    const breakevenPrice = totalCostToRecover / (1 - sellingCostRate);
    const totalSellingCost = breakevenPrice * sellingCostRate;
    
    // 4. 计算单价（如果提供了面积）
    let breakevenUnitPrice = 0;
    if (!isNaN(houseArea) && houseArea > 0) {
        breakevenUnitPrice = breakevenPrice / houseArea;
    }
    
    // 5. 计算相对购入价的增长百分比
    const appreciationNeeded = ((breakevenPrice / 10000 - housePrice / 10000) / (housePrice / 10000)) * 100;

    // 更新显示结果
    animateValue('monthlyPayment', 0, monthlyPayment, 1000, formatCurrency);
    animateValue('annualPropertyTax', 0, annualPropertyTax, 1000, formatCurrency);
    animateValue('totalAnnualCost', 0, totalAnnualCost, 1000, formatCurrency);
    
    // 更新盈亏平衡价格
    animateValue('breakevenPrice', 0, breakevenPrice / 10000, 1000, value => formatCurrency(value) + '万');
    if (breakevenUnitPrice > 0) {
        animateValue('breakevenUnitPrice', 0, breakevenUnitPrice, 1000, value => formatCurrency(value) + '/㎡');
    } else {
        document.getElementById('breakevenUnitPrice').textContent = '请输入面积';
    }
    animateValue('appreciationNeeded', 0, appreciationNeeded, 1000, formatPercent);
    
    // 更新详细分析
    document.getElementById('loanAmount').textContent = formatCurrency(loanAmount);
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('totalRepayment').textContent = formatCurrency(totalRepayment);
    
    document.getElementById('principalPerMonth').textContent = formatCurrency(principalPerMonth);
    document.getElementById('interestPerMonth').textContent = formatCurrency(interestPerMonth);
    document.getElementById('propertyTaxPerMonth').textContent = formatCurrency(monthlyPropertyTax);
    document.getElementById('maintenancePerMonth').textContent = formatCurrency(monthlyMaintenance);
    document.getElementById('insurancePerMonth').textContent = formatCurrency(monthlyInsurance);
    
    // 更新盈亏平衡详情
    document.getElementById('totalHoldingCost').textContent = formatCurrency(holdingCost);
    document.getElementById('totalSellingCost').textContent = formatCurrency(totalSellingCost);
    document.getElementById('minimumRecovery').textContent = formatCurrency(totalCostToRecover);
    
    // 生成图表
    generateChart(principalRatio, interestRatio, taxRatio, otherRatio);
    
    // 显示结果区域的动画效果
    const results = document.getElementById('results');
    results.style.opacity = '0';
    results.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        results.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        results.style.opacity = '1';
        results.style.transform = 'translateY(0)';
    }, 100);
}

// 生成图表
function generateChart(principal, interest, tax, other) {
    const chartBar = document.getElementById('chartBar');
    chartBar.innerHTML = '';
    
    // 创建四个部分的图表
    const principalSegment = document.createElement('div');
    principalSegment.className = 'chart-segment';
    principalSegment.style.backgroundColor = 'var(--principal-color)';
    principalSegment.style.width = '0%';
    
    const interestSegment = document.createElement('div');
    interestSegment.className = 'chart-segment';
    interestSegment.style.backgroundColor = 'var(--interest-color)';
    interestSegment.style.width = '0%';
    
    const taxSegment = document.createElement('div');
    taxSegment.className = 'chart-segment';
    taxSegment.style.backgroundColor = 'var(--tax-color)';
    taxSegment.style.width = '0%';
    
    const otherSegment = document.createElement('div');
    otherSegment.className = 'chart-segment';
    otherSegment.style.backgroundColor = 'var(--other-color)';
    otherSegment.style.width = '0%';
    
    // 添加到图表中
    chartBar.appendChild(principalSegment);
    chartBar.appendChild(interestSegment);
    chartBar.appendChild(taxSegment);
    chartBar.appendChild(otherSegment);
    
    // 动画展示
    setTimeout(() => {
        principalSegment.style.width = principal + '%';
        interestSegment.style.width = interest + '%';
        taxSegment.style.width = tax + '%';
        otherSegment.style.width = other + '%';
    }, 100);
}

// 显示错误信息
function showError(message) {
    alert(message);
}

// 数值渐变动画
function animateValue(elementId, start, end, duration, formatter = (value) => value) {
    const element = document.getElementById(elementId);
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = start + (end - start) * progress;
        element.textContent = formatter(value);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

// 键盘回车键触发计算
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        calculate();
    }
});