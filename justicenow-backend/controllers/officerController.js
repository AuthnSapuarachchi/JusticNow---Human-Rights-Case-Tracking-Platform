const prisma = require('../config/db');


// ==========================================
// 1. GET OFFICER DASHBOARD SUMMARY
// ==========================================

const getOfficerDashboard = async (req, res) => {

    try {

        const officerId = req.user.id;


        const totalCases = await prisma.case.count({
            where:{
                officerId
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


        const investigating = await prisma.case.count({
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

            include:{
                evidence:true
            }

        });



        res.json({

            totalCases,

            newCases,

            waitingForUser,

            investigating,

            recentlyUpdated

        });


    } catch(error){

        console.log(error);

        res.status(500).json({
            error:"Failed to load dashboard"
        });

    }

};




// ==========================================
// 2. GET ASSIGNED CASES
// ==========================================

const getAssignedCases = async(req,res)=>{

    try{

        const officerId = req.user.id;


        const cases = await prisma.case.findMany({

            where:{
                officerId
            },


            include:{

                evidence:true,

                messages:true

            },


            orderBy:{
                updatedAt:"desc"
            }

        });



        res.json(cases);


    }catch(error){

        console.log(error);

        res.status(500).json({
            error:"Failed to fetch cases"
        });

    }

};




// ==========================================
// 3. GET SINGLE CASE DETAILS
// ==========================================

const getCaseDetails = async(req,res)=>{

    try{


        const {id}=req.params;


        const caseData = await prisma.case.findUnique({

            where:{
                id:Number(id)
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

        console.log(error);


        res.status(500).json({
            error:"Failed to fetch case"
        });

    }

};




// ==========================================
// 4. UPDATE CASE STATUS
// ==========================================

const updateCaseStatus = async(req,res)=>{


    try{


        const officerId=req.user.id;


        const {id}=req.params;


        const {
            status,
            description
        }=req.body;



        const currentCase = await prisma.case.findUnique({

            where:{
                id:Number(id)
            }

        });



        if(!currentCase){

            return res.status(404).json({
                error:"Case not found"
            });

        }




        const updatedCase = await prisma.case.update({

            where:{
                id:Number(id)
            },


            data:{

                status

            }

        });



        await prisma.caseHistory.create({

            data:{


                caseId:Number(id),

                previousStatus:currentCase.status,

                newStatus:status,

                changedBy:officerId,

                description

            }

        });



        res.json({

            message:"Status updated successfully",

            updatedCase

        });



    }catch(error){

        console.log(error);


        res.status(500).json({
            error:"Failed to update status"
        });

    }


};




// ==========================================
// 5. ADD CASE NOTE
// ==========================================

const addCaseNote = async(req,res)=>{


    try{


        const officerId=req.user.id;


        const {id}=req.params;


        const {content}=req.body;



        const note = await prisma.caseNote.create({

            data:{


                caseId:Number(id),

                officerId,

                content


            }

        });



        res.status(201).json(note);



    }catch(error){

        console.log(error);


        res.status(500).json({
            error:"Failed to add note"
        });

    }

};




// ==========================================
// 6. REQUEST INFORMATION FROM CITIZEN
// ==========================================

const requestInformation = async(req,res)=>{


    try{


        const {id}=req.params;


        const {message}=req.body;


        const newMessage = await prisma.message.create({

            data:{


                caseId:Number(id),

                content:message,


                isFromUser:false,


                officerId:req.user.id


            }

        });



        await prisma.case.update({

            where:{
                id:Number(id)
            },


            data:{

                status:"ADDITIONAL_INFORMATION_REQUIRED"

            }

        });



        res.json({

            message:"Information request sent",

            data:newMessage

        });



    }catch(error){

        console.log(error);


        res.status(500).json({
            error:"Failed requesting information"
        });

    }


};




// ==========================================
// 7. REFER CASE
// ==========================================

const referCase = async(req,res)=>{


    try{


        const {id}=req.params;


        const {description}=req.body;



        await prisma.case.update({

            where:{
                id:Number(id)
            },


            data:{

                status:"REFERRED_FOR_LEGAL_SUPPORT"

            }

        });



        await prisma.caseHistory.create({

            data:{


                caseId:Number(id),


                newStatus:"REFERRED_FOR_LEGAL_SUPPORT",


                changedBy:req.user.id,


                description


            }

        });



        res.json({

            message:"Case referred successfully"

        });



    }catch(error){

        console.log(error);


        res.status(500).json({
            error:"Failed to refer case"
        });

    }

};




// ==========================================
// 8. CLOSE CASE
// ==========================================

const closeCase = async(req,res)=>{


    try{


        const {id}=req.params;


        await prisma.case.update({

            where:{
                id:Number(id)
            },


            data:{

                status:"CLOSED"

            }

        });



        await prisma.caseHistory.create({

            data:{


                caseId:Number(id),


                newStatus:"CLOSED",


                changedBy:req.user.id,


                description:"Case closed by officer"


            }

        });



        res.json({

            message:"Case closed successfully"

        });



    }catch(error){

        console.log(error);


        res.status(500).json({
            error:"Failed to close case"
        });

    }

};





module.exports = {

    getOfficerDashboard,

    getAssignedCases,

    getCaseDetails,

    updateCaseStatus,

    addCaseNote,

    requestInformation,

    referCase,

    closeCase

};