// توابع جدید برای ویژگی‌های پیشرفته

// تابع بروزرسانی پروفایل کاربر
async function updateUserProfile() {
    if (!contract || !userAccount) return;

    try {
        const user = await contract.getUserInfo(userAccount);
        
        // نمایش بخش مناسب بر اساس وضعیت ثبت‌نام
        const registrationSection = document.getElementById('registration-section');
        const userProfile = document.getElementById('user-profile');
        
        if (user.id.toString() === '0') {
            // کاربر ثبت‌نام نکرده
            registrationSection.style.display = 'block';
            userProfile.style.display = 'none';
        } else {
            // کاربر ثبت‌نام کرده
            registrationSection.style.display = 'none';
            userProfile.style.display = 'block';
            
            // بروزرسانی اطلاعات پروفایل
            document.getElementById('profile-user-id').textContent = user.id.toString();
            document.getElementById('profile-upline-id').textContent = user.uplineId.toString();
            document.getElementById('left-count').textContent = user.leftCount.toString();
            document.getElementById('right-count').textContent = user.rightCount.toString();
            document.getElementById('total-count').textContent = (user.leftCount.add(user.rightCount)).toString();
            document.getElementById('balance-count').textContent = user.balanceCount.toString();
            document.getElementById('saved-balance-count').textContent = user.specialBalanceCount.toString();
        }
        
        // بروزرسانی آمار کلی
        document.getElementById('user-id').textContent = user.id.toString() === '0' ? '-' : user.id.toString();
        document.getElementById('user-upline').textContent = user.uplineId.toString() === '0' ? '-' : user.uplineId.toString();
        document.getElementById('miner-rewards-profile').textContent = 
            ethers.utils.formatEther(user.totalMinerRewards || '0');
        document.getElementById('miner-status-profile').textContent = user.isMiner ? 'فعال' : 'غیرفعال';
        
    } catch (err) {
        console.error('Error updating user profile:', err);
    }
}

// تابع نمایش درخت با سطح قابل تنظیم
async function displayTree() {
    if (!contract || !userAccount) {
        document.getElementById('tree').innerHTML = `
            <div class="tree-placeholder">
                <div class="placeholder-icon">
                    <i class="fas fa-sitemap"></i>
                </div>
                <p>لطفاً ابتدا به کیف پول متصل شوید</p>
            </div>
        `;
        return;
    }

    try {
        const user = await contract.getUserInfo(userAccount);
        const maxLevel = parseInt(document.getElementById('tree-level').value);
        document.getElementById('current-level').textContent = maxLevel;
        
        const treeHTML = await buildBinaryTree(user.id, 0, maxLevel);
        document.getElementById('tree').innerHTML = treeHTML || `
            <div class="tree-placeholder">
                <div class="placeholder-icon">
                    <i class="fas fa-users"></i>
                </div>
                <p>شبکه شما خالی است</p>
                <span>هنوز زیرمجموعه‌ای ندارید</span>
            </div>
        `;
        
        // بروزرسانی آمار
        document.getElementById('total-members').textContent = await calculateTotalMembers(user.id);
        
    } catch (err) {
        console.error('Tree display error:', err);
        document.getElementById('tree').innerHTML = `
            <div class="tree-placeholder">
                <div class="placeholder-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p>خطا در بارگذاری ساختار درختی</p>
            </div>
        `;
    }
}

// تابع ساخت درخت باینری با سطح محدود
async function buildBinaryTree(userId, level = 0, maxLevel = 3) {
    if (level > maxLevel) return '';

    try {
        const user = await contract._getSpecialUserInfoForMigrateToNewFork(userId);
        const directs = await contract.getUserDirects(userId);
        
        const isCurrentUser = user.userAddress.toLowerCase() === userAccount.toLowerCase();
        const nodeClass = isCurrentUser ? 'tree-node current-user' : 'tree-node';
        
        let treeHTML = `
            <div class="${nodeClass}" style="animation-delay: ${level * 0.1}s">
                <div class="node-content">
                    <div class="node-id">${user.id.toString()}</div>
                    ${isCurrentUser ? '<div class="node-badge">شما</div>' : ''}
                    ${user.isMiner ? '<div class="miner-badge"><i class="fas fa-hard-hat"></i></div>' : ''}
                </div>
        `;

        const hasChildren = directs.leftId.toString() !== '0' || directs.rightId.toString() !== '0';
        
        if (hasChildren && level < maxLevel) {
            treeHTML += '<div class="tree-branch">';
            
            // سمت چپ
            if (directs.leftId.toString() !== '0') {
                treeHTML += `
                    <div class="branch">
                        <div class="branch-label">چپ</div>
                        ${await buildBinaryTree(directs.leftId, level + 1, maxLevel)}
                    </div>
                `;
            } else {
                treeHTML += '<div class="branch empty"></div>';
            }
            
            // سمت راست
            if (directs.rightId.toString() !== '0') {
                treeHTML += `
                    <div class="branch">
                        <div class="branch-label">راست</div>
                        ${await buildBinaryTree(directs.rightId, level + 1, maxLevel)}
                    </div>
                `;
            } else {
                treeHTML += '<div class="branch empty"></div>';
            }
            
            treeHTML += '</div>';
        }
        
        treeHTML += '</div>';
        return treeHTML;
        
    } catch (err) {
        return `<div class="tree-node error">خطا</div>`;
    }
}

// تابع بروزرسانی انیمیشن ماینر
function updateMinerAnimation(isActive) {
    const minerAnimation = document.getElementById('miner-animation');
    const minerStatus = document.getElementById('miner-status');
    
    if (isActive) {
        minerAnimation.classList.remove('inactive');
        minerAnimation.classList.add('active');
        minerStatus.textContent = 'فعال';
        minerStatus.style.color = 'var(--success)';
    } else {
        minerAnimation.classList.remove('active');
        minerAnimation.classList.add('inactive');
        minerStatus.textContent = 'غیرفعال';
        minerStatus.style.color = 'var(--gray)';
    }
}

// تابع بروزرسانی آمار ماینر پیشرفته
async function updateMinerStats() {
    if (!contract) return;
    
    try {
        const userInfo = await contract.getUserInfo(userAccount);
        const minerStats = await contract.getMinerStats();
        
        // بروزرسانی وضعیت ماینر و انیمیشن
        updateMinerAnimation(userInfo.isMiner);
        
        // بروزرسانی آمار
        document.getElementById('miner-rewards').textContent = 
            parseFloat(ethers.utils.formatEther(userInfo.totalMinerRewards || '0')).toFixed(2) + ' PToken';
        
        document.getElementById('active-miners').textContent = minerStats.checkedOutPaidCount.toString();
        document.getElementById('available-tokens').textContent = 
            parseFloat(ethers.utils.formatEther(minerStats.totalRemain || '0')).toFixed(2);
        
        // بروزرسانی زمان توزیع بعدی
        updateNextDistributionTime();
        
        // بروزرسانی موجودی
        await updateWalletBalance();
        
    } catch (err) {
        console.error('Error updating miner stats:', err);
    }
}

// تابع تبدیل MATIC به توکن
async function convertMaticToToken() {
    if (!contract || !userAccount) {
        showMessage('لطفاً ابتدا به کیف پول متصل شوید', 'error');
        return;
    }

    const maticAmount = document.getElementById('matic-amount').value;
    
    if (!maticAmount || parseFloat(maticAmount) <= 0) {
        showMessage('لطفاً مقدار معتبر وارد کنید', 'error');
        return;
    }

    try {
        showMessage('در حال تبدیل...', 'info');
        
        const amount = ethers.utils.parseEther(maticAmount);
        const tx = await contract.contributeToMinerPool({
            value: amount,
            gasLimit: 200000
        });
        
        await tx.wait();
        
        showMessage(`تبدیل ${maticAmount} MATIC به توکن با موفقیت انجام شد!`, 'success');
        
        // پاک کردن فیلد ورودی
        document.getElementById('matic-amount').value = '';
        
        // بروزرسانی آمار
        await updateMinerStats();
        await updateWalletBalance();
        
    } catch (err) {
        console.error('Conversion error:', err);
        showMessage('خطا در تبدیل: ' + (err.reason || err.message), 'error');
    }
}

// تابع اهدای MATIC به استخر ماینر
async function donateToMinerPool() {
    if (!contract || !userAccount) {
        showMessage('لطفاً ابتدا به کیف پول متصل شوید', 'error');
        return;
    }

    const donationAmount = prompt('مقدار MATIC برای اهدا وارد کنید:');
    
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
        showMessage('لطفاً مقدار معتبر وارد کنید', 'error');
        return;
    }

    try {
        showMessage('در حال اهدا...', 'info');
        
        const amount = ethers.utils.parseEther(donationAmount);
        const tx = await contract.contributeToMinerPool({
            value: amount,
            gasLimit: 200000
        });
        
        await tx.wait();
        
        showMessage(`اهدای ${donationAmount} MATIC با موفقیت انجام شد!`, 'success');
        
        // بروزرسانی آمار
        await updateMinerStats();
        await updateWalletBalance();
        
    } catch (err) {
        console.error('Donation error:', err);
        showMessage('خطا در اهدا: ' + (err.reason || err.message), 'error');
    }
}

// تابع بروزرسانی اطلاعات برداشت پیشرفته
async function updateWithdrawInfo() {
    if (!contract) return;
    
    try {
        const poolBalance = await contract.poolBalance();
        const userInfo = await contract.getUserInfo(userAccount);
        const minerStats = await contract.getMinerStats();
        
        // بروزرسانی موجودی‌ها
        document.getElementById('pool-balance').textContent = 
            parseFloat(ethers.utils.formatEther(poolBalance)).toFixed(4);
        document.getElementById('special-balance').textContent = 
            parseFloat(ethers.utils.formatEther(userInfo.specialBalanceCount || '0')).toFixed(4);
        
        // بروزرسانی آمار استخر ویژه
        document.getElementById('special-receivers').textContent = 
            minerStats.eligibleInProgressCount.toString();
        document.getElementById('special-share').textContent = 
            (parseFloat(ethers.utils.formatEther(userInfo.specialBalanceCount || '0')) / 
             Math.max(1, minerStats.eligibleInProgressCount.toNumber())).toFixed(4);
        
        // بروزرسانی آمار استخر پاداش
        document.getElementById('pool-consumed').textContent = userInfo.balanceCount.toString();
        document.getElementById('pool-total').textContent = 
            parseFloat(ethers.utils.formatEther(poolBalance)).toFixed(2) + ' MATIC';
        
        // بروزرسانی شمارش معکوس
        updateWithdrawCountdowns();
        
        // فعال/غیرفعال کردن دکمه‌های برداشت
        updateWithdrawButtons();
        
    } catch (err) {
        console.error('Error updating withdraw info:', err);
    }
}

// تابع بروزرسانی شمارش معکوس
function updateWithdrawCountdowns() {
    // زمان‌های نمونه - در واقعیت باید از قرارداد خوانده شود
    const specialTime = Date.now() + 2 * 60 * 60 * 1000; // 2 ساعت بعد
    const poolTime = Date.now() + 24 * 60 * 60 * 1000; // 24 ساعت بعد
    
    startCountdown('special-countdown', specialTime);
    startCountdown('pool-countdown', poolTime);
}

// تابع شروع شمارش معکوس
function startCountdown(elementId, targetTime) {
    const countdownElement = document.getElementById(elementId);
    
    function updateCountdown() {
        const now = Date.now();
        const difference = targetTime - now;
        
        if (difference <= 0) {
            countdownElement.textContent = '00:00:00';
            return;
        }
        
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        countdownElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// تابع بروزرسانی زمان توزیع بعدی
function updateNextDistributionTime() {
    const nextDistribution = Date.now() + 6 * 60 * 60 * 1000; // 6 ساعت بعد
    const timeString = new Date(nextDistribution).toLocaleTimeString('fa-IR');
    document.getElementById('next-distribution').textContent = timeString;
}

// تابع بروزرسانی دکمه‌های برداشت
function updateWithdrawButtons() {
    // منطق بررسی امکان برداشت - در واقعیت باید از قرارداد خوانده شود
    const canWithdrawSpecial = parseFloat(document.getElementById('special-balance').textContent) > 0;
    const canWithdrawPool = parseFloat(document.getElementById('pool-balance').textContent) > 0;
    
    document.getElementById('special-withdraw-btn').disabled = !canWithdrawSpecial;
    document.getElementById('pool-withdraw-btn').disabled = !canWithdrawPool;
}

// تابع بروزرسانی اطلاعات در هنگام اتصال
async function updateAllInfo() {
    await updateUserProfile();
    await updateMinerStats();
    await updateWithdrawInfo();
    await updateWalletBalance();
}

// اصلاح تابع اتصال برای بروزرسانی اطلاعات
async function connectWallet() {
    try {
        if (!window.ethereum) {
            showMessage('لطفاً MetaMask را نصب کنید', 'error');
            return;
        }

        showMessage('در حال اتصال...', 'info');
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAccount = await signer.getAddress();
        
        contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // نمایش اطلاعات حساب
        const accountDisplay = document.getElementById('account');
        const accountAddress = document.querySelector('.account-address');
        accountAddress.textContent = `${userAccount.substring(0, 8)}...${userAccount.substring(36)}`;
        accountDisplay.style.display = 'block';
        
        document.getElementById('connect-btn').style.display = 'none';
        document.getElementById('disconnect-btn').style.display = 'flex';
        
        // بروزرسانی تمام اطلاعات
        await updateAllInfo();
        
        showMessage('اتصال با موفقیت برقرار شد!', 'success');
        
    } catch (err) {
        console.error('Connection error:', err);
        showMessage('خطا در اتصال: ' + err.message, 'error');
    }
}

// اضافه کردن استایل‌های جدید به CSS موجود
const additionalStyles = `
.miner-badge {
    position: absolute;
    top: -5px;
    left: -5px;
    background: var(--warning);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
}

.branch.empty {
    visibility: hidden;
}

.node-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--success);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 0.6rem;
    font-weight: 600;
}
`;

// تزریق استایل‌های اضافی
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);