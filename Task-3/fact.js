// Optimized way: Using Array
let ans = new Array(500);
let base = 1000;
ans = [0];

function arrayMultiplication(arr, no)
{
    let carry = 0;
    for(let i=0; i<arr.length; i++)
    {
        mul = arr[i]*no + carry;
        arr[i] = mul%base;
        carry = Math.floor(mul/base);
    }

    let len = arr.length;
    while(carry)
    {
        arr[len++] = carry%base;
        carry = Math.floor(carry/base);
    }
}

function factorialUsingArray(num)
{
    let no = num;
    for(let i=0; i<=Math.log10(num); i++) {
        ans[i] = no%10;
        no /= 10;
    }

    for(let i=num-1; i>0; i--)
        arrayMultiplication(ans, i);
    
    let str="";
    for(let i=ans.length-1; i>=0; i--)
        str += ans[i];

    return str;
}

console.time("Time");
const factAns = factorialUsingArray(1000);
console.timeEnd("Time");
console.log(factAns);


// let mem = new Map();
// function traditionalFactorialMemoization(num) {
//     if(typeof num != BigInt)
//         num = BigInt(num);

//     if(mem.has(num))
//         return mem.get(num);
    
//     if(num == 1n || num == 0n)
//         return 1n;
//     mem[num] = num * traditionalFactorialMemoization(num-1n);
//     return mem[num];
// }

// console.time("Time");
// const ans = traditionalFactorialMemoization(1000n);
// console.timeEnd("Time");
// console.log(ans);