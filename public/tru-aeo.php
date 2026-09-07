<?php
/**
 * Plugin Name: TruAEO & Social Unfurler
 * Plugin URI: https://tru-saas.com
 * Description: Automated, zero-fluff AEO/SEO schema generation, AI crawler whitelisting (llms.txt), and 1-tap Facebook/WhatsApp syndication.
 * Version: 1.0.0
 * Author: TruSaaS / Antigravity
 * Author URI: https://tru-saas.com
 * License: GPL-2.0+
 */

if (!defined('ABSPATH')) {
    exit;
}

class TruAEO_Plugin {
    public function __construct() {
        add_action('wp_head', [$this, 'inject_meta_and_widget'], 5);
        add_action('init', [$this, 'handle_llms_endpoint']);
        add_action('admin_menu', [$this, 'register_admin_page']);
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function inject_meta_and_widget() {
        $business_name = get_option('tru_aeo_business', get_bloginfo('name'));
        $business_type = get_option('tru_aeo_type', 'LocalBusiness');
        $whatsapp      = get_option('tru_aeo_wa', '');
        $accent        = get_option('tru_aeo_accent', '#1e40af');
        $fb_page       = get_option('tru_aeo_fb', '');
        $position      = get_option('tru_aeo_position', 'bottom-left');
        $bottom        = get_option('tru_aeo_bottom', '20px');
        $offset_x      = get_option('tru_aeo_offset_x', '20px');
        $widget_size   = get_option('tru_aeo_size', 'compact');
        $show_ui       = get_option('tru_aeo_show_ui', '1');

        // Inject high-conversion TruAEO script tag
        echo "\n<!-- TruAEO Engine -->\n";
        echo '<script src="' . esc_url(plugins_url('tru-aeo.js', __FILE__)) . '" ';
        echo 'data-business="' . esc_attr($business_name) . '" ';
        echo 'data-business-type="' . esc_attr($business_type) . '" ';
        echo 'data-site="' . esc_url(home_url()) . '" ';
        if (!empty($whatsapp)) {
            echo 'data-wa="' . esc_attr(preg_replace('/\D/', '', $whatsapp)) . '" ';
        }
        if (!empty($fb_page)) {
            echo 'data-fb-page="' . esc_attr($fb_page) . '" ';
        }
        echo 'data-accent="' . esc_attr($accent) . '" ';
        echo 'data-position="' . esc_attr($position) . '" ';
        echo 'data-bottom="' . esc_attr($bottom) . '" ';
        echo 'data-offset-x="' . esc_attr($offset_x) . '" ';
        echo 'data-size="' . esc_attr($widget_size) . '" ';
        echo 'data-ui="' . ($show_ui === '1' ? 'true' : 'false') . '" ';
        echo 'data-auto-schema="true"></script>' . "\n";
    }

    public function handle_llms_endpoint() {
        $uri = isset($_SERVER['REQUEST_URI']) ? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) : '';
        if ($uri === '/llms.txt') {
            header('Content-Type: text/markdown; charset=utf-8');
            $name = get_option('tru_aeo_business', get_bloginfo('name'));
            $desc = get_bloginfo('description');
            $url  = home_url();

            echo "# {$name}\n\n";
            echo "> {$desc}\n\n";
            echo "## Business Overview\n";
            echo "- **Website**: {$url}\n";
            echo "- **Type**: " . esc_attr(get_option('tru_aeo_type', 'LocalBusiness')) . "\n";
            exit;
        }
    }

    public function register_admin_page() {
        add_options_page('TruAEO Settings', 'TruAEO / TruSignal', 'manage_options', 'tru-aeo-settings', [$this, 'render_admin_page']);
    }

    public function register_settings() {
        register_setting('tru_aeo_group', 'tru_aeo_business');
        register_setting('tru_aeo_group', 'tru_aeo_type');
        register_setting('tru_aeo_group', 'tru_aeo_wa');
        register_setting('tru_aeo_group', 'tru_aeo_fb');
        register_setting('tru_aeo_group', 'tru_aeo_accent');
        register_setting('tru_aeo_group', 'tru_aeo_position');
        register_setting('tru_aeo_group', 'tru_aeo_bottom');
        register_setting('tru_aeo_group', 'tru_aeo_offset_x');
        register_setting('tru_aeo_group', 'tru_aeo_size');
        register_setting('tru_aeo_group', 'tru_aeo_show_ui');
    }

    public function render_admin_page() {
        $show_ui = get_option('tru_aeo_show_ui', '1');
        ?>
        <div class="wrap">
            <h1>TruAEO & Social Unfurler Settings</h1>
            <p>Automate your business's Answer Engine Optimization (ChatGPT, Claude, Perplexity), Schema.org microdata, and 1-tap social posting.</p>
            <form method="post" action="options.php">
                <?php settings_fields('tru_aeo_group'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">Business Name</th>
                        <td><input type="text" name="tru_aeo_business" value="<?php echo esc_attr(get_option('tru_aeo_business', get_bloginfo('name'))); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th scope="row">Business Entity Type</th>
                        <td>
                            <select name="tru_aeo_type">
                                <option value="LocalBusiness" <?php selected(get_option('tru_aeo_type'), 'LocalBusiness'); ?>>LocalBusiness (General)</option>
                                <option value="AutoDealer" <?php selected(get_option('tru_aeo_type'), 'AutoDealer'); ?>>AutoDealer (Car Dealership)</option>
                                <option value="RealEstateAgent" <?php selected(get_option('tru_aeo_type'), 'RealEstateAgent'); ?>>RealEstateAgent (Property)</option>
                                <option value="Store" <?php selected(get_option('tru_aeo_type'), 'Store'); ?>>Store (Retail/E-Commerce)</option>
                                <option value="Organization" <?php selected(get_option('tru_aeo_type'), 'Organization'); ?>>Organization (Corporate)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">WhatsApp Number</th>
                        <td>
                            <input type="text" name="tru_aeo_wa" value="<?php echo esc_attr(get_option('tru_aeo_wa')); ?>" class="regular-text" placeholder="e.g. 27821234567" />
                            <p class="description">Receives pre-formatted qualified lead requests.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Facebook Page Handle/ID</th>
                        <td>
                            <input type="text" name="tru_aeo_fb" value="<?php echo esc_attr(get_option('tru_aeo_fb')); ?>" class="regular-text" placeholder="e.g. mydealership" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Brand Accent Color</th>
                        <td>
                            <input type="text" name="tru_aeo_accent" value="<?php echo esc_attr(get_option('tru_aeo_accent', '#1e40af')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Widget Floating Badge</th>
                        <td>
                            <label>
                                <input type="checkbox" name="tru_aeo_show_ui" value="1" <?php checked($show_ui, '1'); ?> />
                                Display Floating Share/Post Trigger on site
                            </label>
                            <p class="description">Uncheck this to run in <strong>Silent / Headless Mode</strong> (Schema, AEO, and Rank Math will work 100% invisibly with zero screen clutter).</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Widget Badge Size</th>
                        <td>
                            <select name="tru_aeo_size">
                                <option value="compact" <?php selected(get_option('tru_aeo_size', 'compact'), 'compact'); ?>>Small / Compact (Recommended — mini pill)</option>
                                <option value="regular" <?php selected(get_option('tru_aeo_size'), 'regular'); ?>>Regular (Full button)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Widget Position</th>
                        <td>
                            <select name="tru_aeo_position">
                                <option value="bottom-left" <?php selected(get_option('tru_aeo_position', 'bottom-left'), 'bottom-left'); ?>>Bottom Left (Default — avoids right-side chat widgets)</option>
                                <option value="bottom-right" <?php selected(get_option('tru_aeo_position'), 'bottom-right'); ?>>Bottom Right</option>
                                <option value="top-left" <?php selected(get_option('tru_aeo_position'), 'top-left'); ?>>Top Left</option>
                                <option value="top-right" <?php selected(get_option('tru_aeo_position'), 'top-right'); ?>>Top Right</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Bottom Offset</th>
                        <td>
                            <input type="text" name="tru_aeo_bottom" value="<?php echo esc_attr(get_option('tru_aeo_bottom', '20px')); ?>" class="small-text" placeholder="e.g. 20px or 90px" />
                            <p class="description">Adjust height from bottom to clear WhatsApp or chat bars.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Side Offset</th>
                        <td>
                            <input type="text" name="tru_aeo_offset_x" value="<?php echo esc_attr(get_option('tru_aeo_offset_x', '20px')); ?>" class="small-text" placeholder="e.g. 20px" />
                            <p class="description">Distance from left/right edge.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}

new TruAEO_Plugin();
