// Auth Header - Simple header for auth pages with account option
import { Link, useNavigate } from 'react-router-dom';
import {
    Header,
    HeaderName,
    HeaderGlobalBar,
    HeaderGlobalAction,
    SkipToContent,
} from '@carbon/react';
import {
    UserAvatar,
} from '@carbon/icons-react';
import { env } from '@/shared/config';

export function AuthHeader() {
    const navigate = useNavigate();

    return (
        <Header aria-label={env.appName}>
            <SkipToContent />
            <HeaderName as={Link} to="/" prefix="">
                {env.appName}
            </HeaderName>

            <HeaderGlobalBar>
                <HeaderGlobalAction
                    aria-label="Login"
                    tooltipAlignment="end"
                    onClick={() => navigate('/login')}
                >
                    <UserAvatar size={20} />
                </HeaderGlobalAction>
            </HeaderGlobalBar>
        </Header>
    );
}

export default AuthHeader;
