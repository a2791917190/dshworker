window.__ModuleLoader__.load({
	id: "@dshwork/dsh-client-ui-dshwork-brand",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");
		const { useState, useSyncExternalStore } = React;

		const MARK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAYAAADG4PRLAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAgAElEQVR4nO2dC4zlV13Hl2J5WcjuzmxbSpvSstt5b4cu3e7Oe7fLuyBCS4PyShEJVYhEaISg+ISWkIimpgkGCaghSog8oqJENAQMBoOCAREJQlMEKbW0+5idxfRvPr9zvr/zO+femZ3ZvbtbyNzkzL1zH//H+Z3f6/t7nC03vPYNW37cx1e//s3uw3/5d93b3nVX95rbfrN7xevf2r30F99iz7e84de6D37kr7tBn3NlZWWY5/vuf+De9/zJh7t3/+GfdlzHoM9zzif3TI3//p/vd+/94Ee6G1/9xu7J1z2ne9zOme4xV+7rGedfdk03NDbX/cuX/8Mm9+jR5ecvr6yMDOIa/veBB7966MU/3533xInu0Zfv6S5/2jO6z37+XwdKxHM+0YMay8vLszz/4MEjH739zvd1u2Zu6M6/bLp7zBXXdtvG57uLdx/sLp4+1F3y1Kf7uOipz+gu2fOs7rFX7DEO4feHjxy57fjyqRPw2PHjs7qW33r3e7pHPmnaCMci4lpmnveyjkWyScA+k/fVr3+z2/fcl3ZbLhztLrjimu7CiVkbw+Nz3dDYrHHa0Hg9Lt691J1/6e7ul972zoEQ8MiRY7fw/MCRY+/d88ybu6HxBVssF1590AZE/OSnP+fcLlH7I8eBp3vhjOPHl0e0mu/5zve6vc9+Sfeoy6/tnjh9sNsxMd8Njc3UY2R/NzSyr9t+1XXd9l3XpnHVdd1jL5/uPvKJT9mkHjl61AhwqkPX86nPfr57/M693Y5xrmO2GxqdscWEOH3z23+vk7SAW09nLs4ZATXu/8EDn/naf93d/fOXvtJx0x//5KdtMnlmpX76n77Qfenf/7P73n33d4in1Sbs597460Y8ROLQxIE0Jhe74YmFbmhirhsehwNnbCKNiLuu7YZH93VbhnZ2t775d7pBLSqJT8T4Iy4at3NtfcoeG5wTyXDZNQfdoDl8+MgdPzIEhEsgyp1/9EGzBp/+ktd204duMh0Bx2zdtdduEI5g8Job3zG2v9u571nGYS+59Ve6d931/u4Tf/+P3d3f/q5NAobB0MRSd+H0oW7H7oPd8NT13Y7JpW54AgIuJkJOLtgYgjMn5owbEJ1LN76qe/DI0TsGRUANrFsICIeLgAwWjc77zXu+c9oGzRknGtYdBMNsnzhwY/eE0Tm3ALEMnzC6aEYGumLYR+YYuGV0ptt21T4nLCKIicHwePJ1zzGCYulxrOGpg4lgxnX5WJmIRrzJxW5oaskG/z/+KU+zhSBOQCQP6r6f/4rXd+ddMmWLDy408T0663r3cVfu7cYWXmCuzee+8G8duvecEjCu3u/ee1/3vj/7aPfcl/2CKW5EGwSDWFh+Zv1lK/DizDU7pg50O6aWuh2Ti2lMLIQx3104OW+TftHUUnchHDW+0D1hZMbcACbDCGf6RgZLGHkhsCgQqZyP38L9XCvXfLq6KM4Bz3AYrgPXz7UiETgvUoIhUc+88D/fh5gb9RW3DErmMzg5Cnp07nlmwiMq4B4mn7FDIm1iqQwj2JLrLRFxqBmJQAuJU+Gw8fS+ROX20TkbEHD76KwNEW57Nl5sjM7Y8R+/a5+JZBztQRFQ4/DRY7dhDbOwjHBc49TBRMCreWbRHnI3BgKyuCEmUgWJdVY58Bt3f9vMcIiEeEPcITrQMyZCmMix2W7YuIOByJzvhicYcFghlIgnsed6LBPPCOdjIR0rDxGuHUbE0f1GyO0j6Vq2je4zUYaBpEkfFAExtvD3LrhqNkiXA5mY5R7Loj3gxGVhMYdvuf0P3NXgeKtd22mJCm4agwIjBHm/dWS/iTg3nYMJb+LL/a/5bpv5ZvNZ3/EMsXgWYZPIhMDJkkQUJV3J2GaLYKEbzs8VMe17nENDC2eu2x5M+vOfNGkQm0x6+XCDGM/+2dcaAY3jxIUTSTWk+0j3msR+uibmL72eNSICwXGstXTzhgknkYm4xHgAaWCS0GmgHXaxQXeZP4YZn4mjydWE2uRWN1SI3DPG5o1wMnqGIsFE0IpTF3pHnkCuC0mx+MJXmhHRb4GezsDKRoSajp+C05by9UpHZ5fGpUOREjAAqgdxios1MBGqlYDlBlTFBTrhoohwC1CmOwSUhZkJ4KhIJFIiKqLWOBEOFaGdsyIHzxWucvGcF0UmdvxN4fhk5cKFEJHJwprFD9W9nq5OBEbDwEJMx0WbrrUBGExPJ10NEbFYUUfYEADuPv/LKyPRF8YNWR/hlldGBPCCGYIwIKshnEx/Vo0mx19LJDKB5kwn0Zhep89l8tvInLGj/U0Wsek7yc2IBBvqN8ZFwPJ/IWbmgmyZ4qvhnuCmYP4DHujejy5vDLcUsMAiT0YMui7dsz2PJyImQmoEgAGUSEjRVdfZMQS9AWaYFFxZGYEOMNGGVtXr3vqOhC6MziYuM05JHCPRkHRd0neu30S0/H0XqZnA0gs7MgHFqXEBlNdZ1DIhYxKnMmQCV2aLVBxd3k86Joow04mT8/aMLmdxcq8CCtYLPjO50qNYt1cffKH5vW7IoAdNr5f50IKyhQRhjQMTITEAWVhIB53j69+6xwAQ3gf4WPNiYFeJTWQ6xLswisjxrOsC98WJl15LRMsiTETPhGr9PVmmaWSO9JGQFHf0x7NF23BfEtGrieoAq9lIXJCuacFwVAwxxN/k4gvc0d8IBwoM/+XfeJeB17gLZk27mkiL3F7ne5Z7pHnRosSwYXFBOBYUzj/EQ/yz4Na8GBksOJgQjxuTJZVGeZ2IUSba3guGjHOOc5kItZgWhRZGviE57mYEuXGSF4PrvPmKu/y167ui94ohk6WAJlHPE3PputHjUwfMP0MEw8lY2nFhr4cTBfElyzJxt3xR4zK5VnlxJamSbIZ0DWkItcGtwLJFQvCeSZKxuZOLUIKiFvTMwLD0nYu6wDUiXnK0uaCGM7WyKtisXgjJ6ef/TFhflUV3OueN6xzx2MGNkA50To0EL8QTIbUwNKlMFAMkCcBb0mgjAV/QKCYdDHTbzqTXBChEIrqrlDFb94d5PbVkYp3B/4haqY6+q+fw4aOGy6E8+ZHJceS3reZihkt3Rd8tiVNxSuaMPlZgxcVy4gMRuVAjYLVYsv5wY2ShuA3yB4Of1erGck2ZcPbebF+fVcAD51fMEANH0NvJfMZozACpKQJiBopxYDlHYoxs0JnRIwAjGnfZos+/M5BibLYPAU+cMPZH3mLlCM8Ty/YbhcuyoVK5Alrt2S1wPamFUIjoOiAYOMn6jPo0i1I7/kIWi0UE6YZd1wYjocJH5bJEDswGllvJwWhCN+Lzzv3UKzqiKicTp9gPIjLcy2/NpTCCBT3vYEW/yMlCX3zXXZG1dKDCIUxsIl4RMe6rVSt4tp4w10mKhIs7i6grRkrmtmwQFRBA/qQIGHWhjhVuMnC6iCOdF/2/eL32ucz8aCHL0LKRMFd8XvQRMJks1LU4UQQmNwbCg8zIsTds1H1nbIusejyG2er8jO0G37EiIHI9sj3WE2hGtIjkWFecVLkPwdx3gyJNSjFsikgsBlAmbp64lAbR6s9ajLbcOlRJhOb8lTgPCzEQTFyexHJUC9kYm6yJCEFInFqvLgRzBVmBcGaVErOM7oWsVC0muUJZTxbfUehVGrX5e3zZPH2Lr+GEAgGJWD3iMvhoptNqJ1wms75XoTMuIuWCFB/QnvMxXP8FMSuDJ4q34exeFO4LIzruUYLo/eiTBsMsLrj4/1AWp0RbIhFJxegnUqNNQZaBMYUR75AR08DszIHcgxOnT1jMCJg/E6RY0JZsYQGgcnHmMmRTvFf8BH3njnu06iK+GUSbJr7ScYn4FYIT/clgmRVdUdyUYS2K8NsiQou06BXxRU9GztWCSS6MYMDA6Rl8FtSFOJVhs55kqD/+8F9Z2AgCcD7nrIAOtYQr9xU4MF9zdXBkNUFOTmBRhSz7LY4n5D+v6vqgsuKCZeW6TJOrWF4QfxV0FolXc0Z05kUwWWXDskyjGOQaK70p0Z+vN2amSeT6dZQIiLtGQRdFomOU4FT/9C1vKBjqGi6GVBTBbiQcGKygM3sdrFMnXFiIkmjRVaoiDAQS8XlQtJaeEBRtFFORAIUz48opfl904iOmWRz7ojfFiZGIri+DaNVk76hchugj6kaFnSpyEa3Oxp9srE43ZCqjJ7oeKXoAJ+Lnvf3332tEJL9mNesUKXfk2PItSnrCMuW4ydmfqSIzVYRG865FGDlQq4J4mEWRd864pVQp2MZocI7IN1r7UjXrt2iMuMLRksryjN+N+jaC29EVWajCUAXCK8Qr36l9URGxWjThswi5VahNSFO0ENBV11l+DTrO9GEm0snGza95kxmLGDOWp5MZxvJ2Jsq8m0XqOK4AgGyFKg+SVD47GD9yi7NYlD5hEluTCyZCTNSacaEgbjxJEada7XEyXbxVr1uzP02kxxWDkz0cjRx/HQibUy88sSmrgmo1t/kzgdt6F2V6rUiCEq84LwTEb/Z0waPHblstECumwTLFqlV6RUq1qC1TRTB0flswiNqxGQO7XfECVlsWFYo1y+SUSVVugAuFYFhh+G2wPCgNK0S4XUo6KuIw6o0eZz+KY9df/axdcUV/Dh8OnFOOKZ2b0i8iR0YRJGIkX1fQVhPqCQSMRkcEALh3wmzk2SgIu5oohUNFXPQnUm8110KLrfIDR1KWHhkFWxRnwnix7C7iVSP7jYCJiPs8vwU8j5gZP0Rus+JA7Emp2Do6YxyMDuU4/A83C080eKxfxD2ElKIY9YBupY+kw2oUZdjfJ+tM4avgYjjhUpTeHffsvBfd2Q8bDQS06HltNRZ3Z9G4iWw30ieV6b2qLswAALoTXWjhrODveT5P5frMer4s3yd13w5IVnRMsDHK88OMnvMj6g1ITMX3IdqMs09EGBP6y1/7hv0P8H3bb/+uYYbcBJMHFMcwIFaiUKuZBKPRzKFu+JSRRGISIz2Ou6dRzIXf13rQQzVuoRZ0I/qqEVbr9RsbmC3oTud6OfpTSyldcHLRJBPzQM4NOadRfEI8bA7+J8rA3MYEYEBvYn2MBH7vt2uDw3/1nXda5gBzjpjeIt/PXAfksNg3r2qIR1Y0hOGHymI+2cDBJbJN5JiApFULXbrbLpZj6sIM5FXSq6+6wqHuLoQMtejIDwXitcZJFMU6ZiR0FaFv/ndf1oimrIGSKCUL0f3RHEGQbUC2ApKIxYtYvesDH+rue+DIvf3cNiQaQDeEi8TbGiMXE3NGwJj2wdgi/Yfoczk8dcAvgHRBTtSKgPVCSBoAwKxGziVimigm8ix3IKYcepgpAt1y4pV6uBDwwphP00vQYrSE1MaQwVbSHAsoXrDXACxXr+WaFJdDVqrl3BAam0hMgL9IhJ7YIgubSA+1i4AmAqdb8elZBfnaYnpFRUCgM1YKKXBSpMhzuBKxuFFitVBSq8wRu3/+sb/tMKMTLHVNST0gyVeTpPzQCn6rjZSh6CaE7LfazYlOcJ0k1TrGspRjhLwWvw0gH9Cm6E4pNSLaEGZ4XLrb1IlUS9/MuT5jOFu6MV/HCAhnICKhrkUEcpKpEfCKa03mng4BTzYwpYn4kyqAFICQtpCMQLU+qjgoi7gd7uBHQyhmBAQwIRBTaRcOXnvcsAEeZE0HwyuCyTWqU8I8bu7njDPl3WCl23XniHsvsYrLoyQuvo/RCAFV4SumsAnkwLCsUt8ZcAYrhLKtM0nAqDNBJ0DslSRsExcc1wpz7RGVCyGPpiagB6HH+xAw+LwVtFaNqDebRSVUJ1itkXhlFPEoVChimkV91Dms4j5UDVysTHLnQM/bwMTG+8+YJxeM7Aad6VeXN8gR8UOSd8gI44LRD8mnVMVSsFADQYabUFOF6MQMsCq8FENQiic2OaphMNlpwgUV9ga4S6rgTPWeMuFq1yCGiIofGvWgRL1VUu3cazUnAs6dgJj/VkkKnEP28HiOvmeWpRiRSeXLZ5qQEc0nW5p8EkOHchwu1f6FQOiEJEYJ9kYYzjk1ZkP3RV6i8VNgvQqsj8lUFef0ySBvss99gTT1Giq8idwq7oWp7Jnc1Yl5YyaSmloj0sIbljZh8jjV6tkKyKne6EaZriAIg+rgsK4yrRMnhnFxsFpxkPGxvBxNBs9kSbaqkqxkFTphGnisEm+l/IzPWLiY8xG0duK3QERMpnKfs7/bUWWTRyK6rkyp9Rg+ik5AQIWucOWYF+KLImLOOpsOUe1Sg2DJPJdNewcHHNDTaQCwIW48vjwiQgJNATkhKRKqk7luIuCqMShbxQ9j5KPEKJ27crofKJPgKYw60CUmDX+Mz4wzYgq/i9RggUbQYGJtruRYnswb8eNmwEjb8rV5MerRY7eJkQoBOXhWsIKd5AtSXWu6anl5dpAtMjYyEN/UHiJK4A6vfB0tUJdCTZ5Tmt2QEjvsBeSlMyEU6oJYHZY5KBOIExPn2WTZsU7AQwG2nbuVuSBXxXN00msRzHVegMpc9zUReLNFrthjkOX373+gR5Vtef+HPm4EtJt1Hyun+U0dsBNj4isTKxZ0nk3iSWQg8pk81SBu3bXXOagfMaucUoil2jwz4w+k9h/Th4y7+/m8WOFglUy+ibVQY1igN8F7tYXaEqONaiTx3Js2UdyUlCMLCECWd1QvTkAcaihsdWxVIWKKSeG3wIVrgbNnayj0hU5GxF2Qe8FE7oCQxp2hJlGZ10bEnCirgkqIx33ivlCo2opvYnw43hank4/mZn4LBPT6gwki7CMeG90qzrWFksUzzMQz9wNe3W9OPHm3TrApUJX0oFpxnOshCYA/dPXBF5pINSJmMefcWIWB6nBTW8KdJmve221FQw0CAi5gQKVEpOurZgoxI6C37iKkADbvxbie58HIoMmimYUGc8WUjR4CctEJHciIelNkIjGKDG59kHM1onGz55k3OxFNJzYVwW3MsDjqeaJH9nkDnn6oEyKUfE7VsiubLEmohnDituoaeqP6UYx6CXrzOxOjk4tGQDXj65euYRnYOIiGRVooqU3ZWzRRgxhF3GoCB9lT5VQIqHjaN+7+toW4uFHr0JSLU9QswVMSglVo4irCXW5YzBkaxJwwMGKQSiVanlwY3lurK0aVFR4szCIyC3HLQsuxy1w7z3mQjEgZGS/ccw8B+YOD6LkwFkqSb5NWrPkhl01X1uiZduo3won3fOd7RkT5imrloeh2TFdvk3gVtVcuijpFMITLyjZwnzP7nVXiUUSDAqhgLVJyz7Y4/DMV85DJkPupMVg0gPwsorWYxv5g4fBlgcgpiyu368iOJVYaZrbSBQbZEOB0CHg4J83CMcB++K9ORGvpUXrQqHAkti6Rvk9Wd4rjpTBOAp5jrk6t52LcMlvuE8Wytcy+yQVzxFlYICu8ZshIUQMGS00Zqb/Ha45zsr4x9gfRCBpjLFz5KQkdAJfkogGZCUyKC881AW9oBjeLrjYiZugtEbCI0yo7vKqpCGkVgt/cioz6rU5g9vTJyUT81PMldaNiIaGjGQRuGWQq4JaBLsXBdTN4bV0/njjhgYS11JX9AevkR2aNwnl5JaTC++SrYNxAZPDJc02ofuNoBhgA56332pR0V53bWkRo5KTGMmyLSDwnpikwUbJX7keqUjziq+TYqkkf5dYMXhN1QVoAFKC/eeZ/3mfwHr/DO5Bbc1ICMjBVicepGqmOCGc9wWdjswPvOjuIsRJ0xF/8zT+Yz6Y+nYmAiuD3Eq4FkntCQaHyV9npnvOaxSs2ArYEcNfxlR8ODG6kyQLSLvqmFQG1csE7jYAg/iEuqJZYEhFwIaVn8pcG2SBukOP2O99nkQyzTBV6auJ2q46+jjeoSyk1k2EjC12dlSQNzta8GDDKC4wTViz6wxGZpo5NoRs4U1y4Vir5uRjLAa+lx4rFFLOP6Gh/U0DSphLGUq7IfSorEAFZHCwSRQnUqZdn5hVJwGfoMg1yggBFVht8zve4djVlb4c+Y6QeMNkg4UOrjci+jkNquTZOXMiKI2XuXBPrhtWImJGU+3/w4FfICMPRB51Rlpf8sYRlhpp6ReorV6PO7JbFKs7DfRETxFgm7zOX4KgMa/5n4xobSDI+11BObRzKm2lHOdZ0XZ0Exmj6LsNqJT8/EzBbdXAqCluO/cNxHM8ijMlER3mmuUcwemN7HnWPMT0t3pwrJKOIOWLSNQeqE+R8BJqljtRS0wfvTS31HUqCVlqiBpweh77D6+qmET1qnmpdmGKZVcWFS2ZtYR5jWfHbtTrqnSsuPJybqOL6sHKTX6eC0RK999ieF30qQCsCJh/RuwpOH7I5EvchxdQ62bYZuGQq5RlZ1KLpyuF1iU0JWWyC1KdGMjr+sSS958YxZlhZ3rgudJAo6Xwl2Ovd3gfYrvFMjNe99R3JN8M/rJCVfgWsffRjDhRLfCIG1ddTqBQRAzgd0EMJuhYpCYnLMY2jysNpkqliyVyslxROrcStsmKzHsQnxJlUQNfEBRBUwPXkH7JquFhFih/OBHzw6LE74A4QDtU/JsOsrXEM/mDsXaYxmnKF8DXbXCE1REJUGwFzkZAljYXstETIWOode+qUdMaI/Pgii5kHE/M1AQWPwVXGhYaNKpW9pPiJgLxPTA4IS7n+D7exAvCd44jUE4Bxmm6fuj7r+ACVhZAOaQwQwNPcQ+d5ygOwFm1h5FIDAGeAZysQymCIkqWc2yriNVwXUzBCNp0HjL3Ys46uVDcqDkIUQBzVcTvr99T8pd5iiFJFjMEmHw5A9w2rDIwOC9B6m+ZenzByoAhoHJWJiFWLwcd8KcSm5DBvRxaavCq/07LBq04aqu2I2eNFB5eWKm17lULEVW8UH0PKuMehDSXUiFoFHhW3ejjipDcEEY+EAWtENElPycWA83A5LCjciFBtVSA4kZoR9r3AYAKF8WrbDHxY2oZnzomQdTl330qofv5nzLdZDwFlDrM66gTauApyBRGp39zg5LyH/h9uCM3KysqwtrrB2aZTrxEx9DBrh6L7cKOKVdD5KqXWQqVeAf9RERBzwzInVmnyXoxTqqoKxpokgdJBasSoF2xYlYCmC7POwHJT0wPpi94q2vQ/NwcXogfUxehU90I4k2M5tIwmPKasM5V28dq4sspES80MMF76gfnME26F0i5s5DpL5dB4wWpsNhQToIIoL5hsxqO9ScN6CLhSkBluEqUveC3mYRaFW5xddTFCnAhSGoTIYyCeqTNkAinLIv3hc6HX9UayBLRAKXdTIzoRL+bWxPwacZ8c92i1pw5MqXmP8mY8ah9K0WIlcJ3h3ZsfasRjMYVdX+yamgLVk94s9WzcpMFrUraxStarU3NV055U6cRky5g5FaMGEaxJIh8UOIpVrn0A8cO2j85awk+smVuP/o2N6Dh26m1d7s8t03yfyszDDcHqBKLTfhMspFJbWSNYVcd8bxdSgrnlPZXHZYMFsQ3xdt/UXbDn1u4nF99uzywM7flkEN/YOghIOr1ab9lNGjZYkmRTk9SMVmTLSzV/TK7Ki0/VsMH0T+n0abcTpUowqdtH9lsmNVYhC0bZAhtJPiZ9X40GOH5pg3W9Z6BxPgwUGWmgT9wPEspgxZ17vYTMxV61d0VbhaRovCC7hPLY+XBfdt/UPeaGj3WPfuX93Xkv/z8bj3z58e4nXvqt7lHP+IBdn0mK0TWMmJiugGGSbi7vOhI61NcyPl846QATs+YvQXyt1tX6ia01yJqLKX3cLBduqQe7Uto74o9dyNBp4kaufb3nIqia9nVarPQY57Ok3137rKWWQGstRrgv1rcLfTHcVU3qfOORvDdEIHJFQM45uWScBqEefetD3Xm3PFQR0J5f/ZB9zvc457onEjwR0ZUMmkTAlGMiUzgr39xxXenv3GDssbnRLvCILCIKnJtzunMddMM2ClFyBw0WUNxg8WRiWkRBnyrJtzj5STUgTZRKogEX2hZDbC+UfcRIQA9bNRVIWwMQkoiJeE1JV3CeiPe4V634gGgMEZTXcCff35A4wzdUS4x0UXWKQXSA5UOpsgbgW8WJcMbJ3Iy2y5+2posO9VYGBM3XgliFW4C5VstkXu1cPCtL3bg7W6AsCqBFog3xmqiaUgd/NSRQa5ZiQQbfToUqGVrTd9P3Z+1eEI8Q5xE/s+ycB9FEQA2ICpERs+u6QSl8Vh2EsFqKscRtpRlQ23yn1JrDtZrYGIJaj4gToUnt1waKWulDnFfnya2qMCaIlJAgpAVzsl055SPyGoAawmiBIJqV8AvqYlGHEyeG8SMtZGQp9xkpCSXRdZwxb/qR1UsknhEUiG50rnvki75oohICplGIqCGuhIBw6ymltKsuQRhp6VTftLtSoUxOjsUdwRgCR4ybH0YDR+6AhoVqsj/J5KqSKsXtFnznM8XqEH+KV2LeqylA5HhyVrBEjx5/6PkMbVwcLVMIp0AwhlSEzVhM5n5ki9OeQ38z73KRu0RVZdPN7momSlksWXxCuC0vPuxElO6LujC+tyERqlWKvpB/yGTJUqs7G1KYEfY5Gs+hmCxSWQQkrcrp1/FblwO/FEvYCHrihMXbsBjRV8NN2+LYnkqON64BOKUWirW5WvnhCIPjqUd4O0iFgIhKZo55LviiqWKJamZ1vMh4Z7xf7y9Tc6ckU/rdYsJcd99keq1wXyFgHPXnGySgNgPhNTqG/EZWnZn3nv0lxKYg8GXrtyT7sVCZXEQVxZSIKFb5yXRUTL5KBseBZEiFdpJK/eM8iHnELQsGrtJx1puUTOld2xUCjubaLUkXXan0y9ikKBbKZkvT/b7xmOWXDCbmSwSEqyBMHC3xxKE8b4iA7UCckqzKzcCJBtoGdCG10yplwyodNjM7d73Fh2I183tEKxPU6kZWv7gf9ASr0Fp2jfZu8OgpgdmIUrkZiwXOUa7lRheuXpM3ZOfHD+1TOhb7m5WoTWnELsRF3Cd/UyI0ug4tIdN7hfvQmfIEOp8AAAgzSURBVKdMPK1inGfigVYhROSiQfA9GywX7kPsxJVplbIKjZvGUx4JN4aYBAGCyyMkhzhlAgGhI/y1NVuBbq47JFX2flDbFKSGROp6LOKIDSMlsHRdZOadXdK91EWdPU3zWmJ7pGHRfECkElaluQtB5/UbZqXe8lD3qKW7uoFkf+HjMen4fB6GiZiiItHtnhNhJxdlvPGMoZN0zLwtDlAWUu1wplko8gW3+wKpw13eOUlbBuQkJJMSE0umQ9tdyvpy3okTyYjKrgOi3lpyWsndat0pYrPYKI2acgXnVoyx1M1RXChXIonNwn36316/6Isb9wP7cmLuTsszcTasRHREiiMKTS/Yn3XBqJraFatM4kcVPRCq2rkaR11lyXlH6OHQgzTmbpZWWSWrDCLC7VjEEBFOAniH2zHM8PVwlZAqbVHJ/Q88+BkiLdQKlvrA2M047DDauhPKcjNR2jT1U8820BhKxnffZMSRKI0ElCvB5yAx2ACnTUCJIekJdBQIhbUuyWXMMrHTkOjJRMt1GHJwo5Mb43BqIpua4KRVva1qWNdvT4l629bYC42kLLXDhKs4Hw47RIK7teFVvC/tyFn1E4+9auKCCWXqVTVUCM6WrYySe2H3ADQ4Nm8ANoQyjnz5cTNw+B+xKdiN54EQsB24Bog8fDFWrAokUyOhZDXa5GdLzh3a/FqNBNzSiyGWTLy25cdQ3OUz9FIrHXrr/jASu0poQp/i28Lt6Ll261NCWB6VyRH31nVRgWYkXmxfVhrO1ruyVRuGZS5NYPWsRyR4RnqZigpw38CJF51ystWUoWzFkqxeclEcWgrclq3ViCHad0KHh7qDbagprzK+ArS3Sg8WS1rSosn5LhG7VcKSIikWEbEt37QDTa4FDIQqfQUWe0VrjtjEfqe9Dfm06VXmZAtNwZkzbk0n8RzijP3yQgc9AKMBgoG2rNXizr3esiM2Ni2EDIh96BuW3mvKv0ZzGVzeRLh0f2i2Ie/pE1q6Jem4qq9HzyplQknLtEVWzND30vAtxXPOS2j4GrvN+5Z9kYCVOC1NbZW0WzbVzJul+DbsIZWl38YfZ3JgIJA3CQLjXXuzpRrzJ6NTbCZ6IKAmOyL62+NQP+ue2NtqcbgUyrEcWLKtr9zbLd34qg6fkzRJBsYL1i8SxDO7q91iApHajIXYZzRzlpoQpWTpwqVxH8S2B2lVb990ODwrxIvtudQByUIxT5pMe8HmqAU3qfoEBUFd3Ibavbo53GxPJldslBM7BtpxYzpDJqBVZeVsc7kWQpwwXghl4UfWWdxhP4yqsWzoM5qJVhJ3+7QDy12jqm2JqrZcq2/ZDrHPGge2+hFgGKgKf4zJxP0g6s1ExtT35D8VpEVZYo52TMxXWQG2ujMBVyW+WiJTdjY2Y+eGQJSDtcgLxosqtnx7nja/s9p1pljBWpS6xrKxVt3TtDTqC1wcknpLe+hkwUfs9awScLUB4gJXsjsz3KCyLOt2D+6IiMW8Jt1g1960DbrGrmTpIuIYEo8QkwKQtN1B2jJBkXM1X2dwfM6rBCnEprKtsUQhnFo+ikPKxGfHPXb1zd+TqKx3u4mNZ4sILnUnbYPZAgzUCb5Zzz5cCOgcurIygsVHwzmKHbFg0ZnoSjW5g1Pw10iBmO7TOECbF1sd3aW7TUSLWNZk/Sl7THzD+SwawGohSohNhghI+Eo7b8aqJvfr8ibNZVeZ1h9ttikKbU5azvPM7Lzbt4tNb0YbAPHw+3NOtLUG6Q6Az3AHLgn6CQKrKcB3773PhhoHkOKnBgE0rsMZx4KEUBCDOB7HWqvjVKzx8NAVkRZZnaENmbao691bqkn6arYDattCVwSMes63Pqp7k8bO+uecSH1T/o4t33I22lqurJIRQN4OuKeyrWMfubgRpRNuvN2JNLgQ0VARGhQ6DEekqO1rWoLBefugas/E9N45J9iZIMoxou25u4O6Sq2VvmHFoIeP3IHOg3MR3bYFrUGAJYGr7F0R6yXjNgitK9D28w57KMY9KZyrmmBwIFT1Xuhuf9oTplAMYokKJXQLeZY8E3/T0PsaWHca/b4ff8N32GOCqEQcN7/mTT2/B5zuN3S8OHgPAwZRia+HfgUXtSKV3F7SJiw753WWdewnFzd2zhzZU6xZJ/FWnBc666eE6XS8Et2viViguQGKUCaTiIEyp3nGOoyDvMs4eM+/f+VeG7zWUCa2vqfv+riitxEAWWUMO164htXOHc+v/tQWSQmrvN79LOe/9vhkNbd5a5PMbTI8lNWuTGwXp3FfqCiC8xZ6Try4L/Ba1UkbGRgQ2sEsme6LXrTPqsY1WGukwv3S6G214v5Y5N/bFGCp/s70oXKOPc/qHU99etV4wHtxB3M97j/oE1o1+imbN5c69lp8xn0r3NF3tyD4dwGJaY2VsmFm3oo11NQPhIAEdFXpkzpB7K/2G/SuC3nCWkKJIBpaBHEhxO9YZ7/w+UXxHKt0d4jvRaKt1jGivQ7LHAjnO9nQ98XR6krYHsMNo2yV1t8P/b+DaNbgs4GhK2RvkcWFY6w97uRoqxOfnG39z2c2omN+qmNXOM8qw8+3q4hsDa67GmucZ80Rvtvv2Pq/Pb9EfxztZ6YiLp+uxsAICMaJUUDUgVR4jAKsORJgAYgZvGbwfhx8l9QJBr/V0HuM+B1exzGXz6Nj63W/c7VjtevRczyHntvP4jX1+0z3E3+/2jn7XXc8XpxPS2PZfGw+Nh+bj83H5mPzsfnYfGw+Nh+bj83H5mPzsfnYfGw+Nh+bj83H5mPzsfnYfGw+Nh9bflwf/w94dm0ddzIKUgAAAABJRU5ErkJggg==";

		// ── overlay 可见性/当前页 store(模块级,两个入口共享) ──
		var v = { open: false, page: "plugins" };
		const listeners = new Set();
		function emit() { for (const l of [...listeners]) l(); }
		const store = {
			subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },
			getSnapshot() { return v.open ? v.page : ""; },
			openPage(page) { v.open = true; v.page = page; emit(); },
			close() { v.open = false; emit(); }
		};

		// ── 样式 ──
		(function injectStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style[data-dshwork-brand]") !== null) return;
			const css = [
				".dsw-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(4,8,16,.55);padding:24px;box-sizing:border-box}",
				".dsw-panel{width:min(720px,100%);max-height:86vh;overflow:auto;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#111);border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.35)}",
				".dsw-top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08))}",
				".dsw-brand{font-weight:700}",
				".dsw-close{background:0 0;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--dsw-alias-label-secondary,#888)}",
				".dsw-body{padding:16px 18px}",
				".dsw-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:10px;margin-bottom:8px}",
				".dsw-item b{display:block;font-size:14px}",
				".dsw-item span{font-size:12.5px;color:var(--dsw-alias-label-tertiary,#777)}",
				".dsw-action{display:inline-flex;align-items:center;gap:6px;background:0 0;border:none;cursor:pointer;color:var(--dsw-alias-label-secondary,#666);font-size:13px;padding:6px 8px;border-radius:8px}",
				".dsw-action:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}",
				".dsw-corner{display:flex;align-items:center;gap:8px}",
				".dsw-dot{width:7px;height:7px;border-radius:50%;background:#3fd68f;display:inline-block}",
				".dsw-status{font-size:12.5px;color:var(--dsw-alias-label-secondary,#666)}",
				".dsw-avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#4f7cff,#7aa2ff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}"
			].join("");
			const tag = document.createElement("style");
			tag.dataset.dshworkBrand = "true";
			tag.textContent = css;
			document.head.appendChild(tag);
		})();

		// ── 内置内容(占位/示例) ──
		const PLUGINS = [
			{ name: "工作区", desc: "项目与会话集中管理(harness 原生)" },
			{ name: "皮肤主题", desc: "界面皮肤:whale-girl(已启用)" },
			{ name: "桌面宠物", desc: "dsh-desktop-pet(已启用)" },
			{ name: "DSHwork 品牌", desc: "品牌 logo 与侧边栏入口(本插件)" }
		];
		const SKILLS = [
			{ name: "报告生成", desc: "把多来源信息整合成结构化报告 / 方案" },
			{ name: "文献检索", desc: "多源检索、归纳要点与引用" }
		];

		// ── 组件 ──
		function BrandMark({ size }) {
			const s = size || 24;
			return React.createElement("img", {
				src: MARK, width: s, height: s, alt: "dshwork",
				style: { objectFit: "contain", display: "block" }
			});
		}

		function Panel({ title, items, onClose }) {
			return React.createElement("div", { className: "dsw-overlay", onClick: onClose },
				React.createElement("div", { className: "dsw-panel", onClick: (e) => e.stopPropagation() },
					React.createElement("div", { className: "dsw-top" },
						React.createElement("span", { className: "dsw-brand" }, title),
						React.createElement("button", { type: "button", className: "dsw-close", onClick: onClose }, "×")
					),
					React.createElement("div", { className: "dsw-body" },
						items.map((it) => React.createElement("div", { className: "dsw-item", key: it.name },
							React.createElement("div", null,
								React.createElement("b", null, it.name),
								React.createElement("span", null, it.desc)
							)
						))
					)
				)
			);
		}

		function Overlay() {
			const page = useSyncExternalStore(store.subscribe, store.getSnapshot);
			if (!page) return null;
			const isPlugins = page === "plugins";
			return React.createElement(Panel, {
				title: isPlugins ? "我的插件" : "技能",
				items: isPlugins ? PLUGINS : SKILLS,
				onClose: store.close
			});
		}

		function FooterAction() {
			return React.createElement("div", { style: { display: "flex", gap: 2 } },
				React.createElement("button", { type: "button", className: "dsw-action", title: "插件", onClick: () => store.openPage("plugins") },
					React.createElement("span", null, "\uD83E\uDDE9"), React.createElement("span", null, "插件")),
				React.createElement("button", { type: "button", className: "dsw-action", title: "技能", onClick: () => store.openPage("skills") },
					React.createElement("span", null, "\u2728"), React.createElement("span", null, "技能"))
			);
		}

		function Corner() {
			// 右上角:运行状态 + 用户头像(占位,用户暂无真实接口)
			return React.createElement("div", { className: "dsw-corner" },
				React.createElement("span", { className: "dsw-status" }, React.createElement("span", { className: "dsw-dot" }), " 本地运行"),
				React.createElement("span", { className: "dsw-avatar", title: "未登录(占位)" }, "U")
			);
		}

		const inject = ["slots"];
		function apply(ctx) {
			// 首页 hero 品牌 mark(新会话时中间那个 logo)
			ctx.slots.inject("conversation.hero.brand.mark", () =>
				ctx.slots.register({ name: "conversation.hero.brand.mark" }, BrandMark));
			// 侧边栏底部:插件 / 技能 入口
			ctx.slots.inject("sidebar.footer.action", () =>
				ctx.slots.register({ name: "sidebar.footer.action", id: "dshwork-entries" }, FooterAction));
			// 弹出清单页
			ctx.slots.inject("shell.overlay", () =>
				ctx.slots.register({ name: "shell.overlay", id: "dshwork-entries" }, Overlay));
			// 会话头部右上角:运行状态 + 用户占位
			ctx.slots.inject("conversation.session.header.corner", () =>
				ctx.slots.register({ name: "conversation.session.header.corner", id: "dshwork-corner" }, Corner));
		}

		exports.BrandMark = BrandMark;
		exports.FooterAction = FooterAction;
		exports.Overlay = Overlay;
		exports.Corner = Corner;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
