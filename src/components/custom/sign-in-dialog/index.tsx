import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useUserDetail } from '@/context/UserDetailContext'
import Lookup from '@/data/Lookup'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { useMutation } from 'convex/react'
import React from 'react'
import { api } from '../../../../convex/_generated/api'
import { v4 as uuid4 } from 'uuid'

const SignInDialog = ({ openDialog, closeDialog }: { openDialog: boolean, closeDialog: () => void }) => {

    const { userDetail, setUserDetail } = useUserDetail();
    const CreateUser = useMutation(api.users.CreateUser);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log(tokenResponse);
            const userInfo = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: 'Bearer ' + tokenResponse?.access_token } },
            );
            const user = userInfo?.data;
            await CreateUser({
                name: user.name,
                email: user.email,
                picture: user.picture,
                uid: uuid4()
            })
            if (typeof window !== undefined) {
                localStorage.setItem('user', JSON.stringify(user));
            }
            setUserDetail(userInfo?.data);
            closeDialog();
        },
        onError: errorResponse => console.log("errorResponse: ", errorResponse),
    });

    return (
        <Dialog open={openDialog} onOpenChange={closeDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='text-center'>{Lookup.SIGNIN_HEADING}</DialogTitle>
                    <DialogDescription>
                        <div className='flex flex-col items-center justify-center gap-3'>
                            <p className='mt-2 text-center'>{Lookup.SIGNIN_SUBHEADING}</p>
                            <Button onClick={() => googleLogin()} className='bg-sky-500 text-white hover:bg-sky-400'>Login with Google</Button>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>

    )
}

export default SignInDialog
