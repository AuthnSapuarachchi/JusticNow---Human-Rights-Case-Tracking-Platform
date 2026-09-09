const prisma = require("../config/db");


// ===============================
// GET OFFICER DASHBOARD SUMMARY
// ===============================

const getOfficerDashboard = async (req, res) => {

    try {

        const officerId = req.user.id;


        const totalAssignedCases = await prisma.case.count({
            where:{
                officerId: officerId
            }
        });


        const newCases = await prisma.case.count({
            where:{
                officerId,
                status:"SUBMITTED"
            }
        });


        const waitingForUser = await prisma.case.count({
            where:{
                officerId,
                status:"ADDITIONAL_INFORMATION_REQUIRED"
            }
        });


        const investigatingCases = await prisma.case.count({
            where:{
                officerId,
                status:"INVESTIGATION_IN_PROGRESS"
            }
        });



        const recentlyUpdated = await prisma.case.findMany({

            where:{
                officerId
            },

            orderBy:{
                updatedAt:"desc"
            },

            take:5,

            select:{
                id:true,
                status:true,
                category:true,
                updatedAt:true
            }

        });



        res.status(200).json({

            totalAssignedCases,

            newCases,

            waitingForUser,

            investigatingCases,

            recentlyUpdated

        });


    } catch(error){

        console.error(error);

        res.status(500).json({
            error:"Failed to load officer dashboard"
        });

    }

};





// ===============================
// GET ALL ASSIGNED CASES
// ===============================

const getOfficerCases = async(req,res)=>{


    try{


        const officerId = req.user.id;


        const cases = await prisma.case.findMany({

            where:{
                officerId
            },


            include:{
                evidence:true,
                statusHistory:true
            },


            orderBy:{
                updatedAt:"desc"
            }

        });



        res.json(cases);



    }catch(error){

        console.error(error);

        res.status(500).json({
            error:"Failed to fetch cases"
        });

    }


};





// ===============================
// GET SINGLE CASE
// ===============================


const getCaseDetails = async(req,res)=>{


    try{


        const caseId = Number(req.params.id);



        const caseData = await prisma.case.findUnique({

            where:{
                id:caseId
            },


            include:{

                evidence:true,

                messages:true,

                notes:true,

                statusHistory:true,

                officer:true

            }


        });



        if(!caseData){

            return res.status(404).json({
                error:"Case not found"
            });

        }



        res.json(caseData);



    }catch(error){

        console.error(error);

        res.status(500).json({
            error:"Failed to load case"
        });

    }


};





module.exports = {

    getOfficerDashboard,

    getOfficerCases,

    getCaseDetails

};